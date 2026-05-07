import Diamond from '../models/Diamond.js';
import ProfileEvolution from '../models/ProfileEvolution.js';
import DiamondTransaction from '../models/DiamondTransaction.js';
import User from '../models/User.js';

class DiamondService {
  /**
   * Initialize diamond profile for new user
   */
  static async initializeDiamondProfile(userId) {
    try {
      // Check if already exists
      let diamond = await Diamond.findOne({ userId });
      if (diamond) return diamond;

      // Create new diamond profile
      diamond = new Diamond({ userId });
      await diamond.save();

      // Create profile evolution
      let profileEvolution = await ProfileEvolution.findOne({ userId });
      if (!profileEvolution) {
        profileEvolution = new ProfileEvolution({ userId });
        // Unlock classic design by default
        await profileEvolution.unlockItem('design', 'classic', 1, 'common');
        await profileEvolution.save();
      }

      return diamond;
    } catch (error) {
      console.error('Error initializing diamond profile:', error);
      throw error;
    }
  }

  /**
   * Earn diamonds from post creation
   */
  static async earnFromPost(userId, postEngagementScore = 1) {
    try {
      const diamond = await Diamond.findOne({ userId });
      if (!diamond) throw new Error('Diamond profile not found');

      // Base diamonds: 10 + engagement bonus
      const baseDiamonds = 10 + Math.floor(postEngagementScore * 5);

      await diamond.addDiamonds(baseDiamonds, 'fromPosts');

      // Record transaction
      await DiamondTransaction.create({
        userId,
        transactionType: 'earn',
        amount: baseDiamonds,
        source: 'post',
        description: 'Earned diamonds from creating a post',
        balanceBefore: diamond.totalDiamonds - baseDiamonds,
        balanceAfter: diamond.totalDiamonds,
        multiplier: diamond.diamondMultiplier,
        baseAmount: baseDiamonds / diamond.diamondMultiplier,
      });

      return { diamonds: baseDiamonds, newBalance: diamond.totalDiamonds };
    } catch (error) {
      console.error('Error earning from post:', error);
      throw error;
    }
  }

  /**
   * Earn diamonds from liking/reacting to content
   */
  static async earnFromLike(userId, contentType = 'post') {
    try {
      const diamond = await Diamond.findOne({ userId });
      if (!diamond) throw new Error('Diamond profile not found');

      // Base diamonds: 1 per like
      const baseDiamonds = 1;

      await diamond.addDiamonds(baseDiamonds, 'fromLikes');

      // Record transaction
      await DiamondTransaction.create({
        userId,
        transactionType: 'earn',
        amount: baseDiamonds,
        source: 'like',
        description: `Earned diamonds from liking ${contentType}`,
        balanceBefore: diamond.totalDiamonds - baseDiamonds,
        balanceAfter: diamond.totalDiamonds,
        multiplier: diamond.diamondMultiplier,
        baseAmount: baseDiamonds / diamond.diamondMultiplier,
      });

      return { diamonds: baseDiamonds, newBalance: diamond.totalDiamonds };
    } catch (error) {
      console.error('Error earning from like:', error);
      throw error;
    }
  }

  /**
   * Earn diamonds from sharing content
   */
  static async earnFromShare(userId, contentType = 'post') {
    try {
      const diamond = await Diamond.findOne({ userId });
      if (!diamond) throw new Error('Diamond profile not found');

      // Base diamonds: 5 per share
      const baseDiamonds = 5;

      await diamond.addDiamonds(baseDiamonds, 'fromShares');

      // Record transaction
      await DiamondTransaction.create({
        userId,
        transactionType: 'earn',
        amount: baseDiamonds,
        source: 'share',
        description: `Earned diamonds from sharing ${contentType}`,
        balanceBefore: diamond.totalDiamonds - baseDiamonds,
        balanceAfter: diamond.totalDiamonds,
        multiplier: diamond.diamondMultiplier,
        baseAmount: baseDiamonds / diamond.diamondMultiplier,
      });

      return { diamonds: baseDiamonds, newBalance: diamond.totalDiamonds };
    } catch (error) {
      console.error('Error earning from share:', error);
      throw error;
    }
  }

  /**
   * Claim daily login bonus
   */
  static async claimDailyBonus(userId) {
    try {
      const diamond = await Diamond.findOne({ userId });
      if (!diamond) throw new Error('Diamond profile not found');

      if (!diamond.canClaimDailyBonus()) {
        throw new Error('Daily bonus already claimed today');
      }

      const balanceBefore = diamond.totalDiamonds;
      await diamond.claimDailyBonus();

      const diamondsEarned = diamond.totalDiamonds - balanceBefore;

      // Record transaction
      await DiamondTransaction.create({
        userId,
        transactionType: 'earn',
        amount: diamondsEarned,
        source: 'daily_login',
        description: `Daily login bonus (${diamond.dailyLoginStreak} day streak)`,
        balanceBefore,
        balanceAfter: diamond.totalDiamonds,
        multiplier: diamond.diamondMultiplier,
        baseAmount: diamondsEarned / diamond.diamondMultiplier,
      });

      return {
        diamonds: diamondsEarned,
        newBalance: diamond.totalDiamonds,
        streak: diamond.dailyLoginStreak,
      };
    } catch (error) {
      console.error('Error claiming daily bonus:', error);
      throw error;
    }
  }

  /**
   * Earn diamonds from referring friends
   */
  static async earnFromReferral(userId, referredUserId) {
    try {
      const diamond = await Diamond.findOne({ userId });
      if (!diamond) throw new Error('Diamond profile not found');

      // Referral bonus: 50 diamonds
      const baseDiamonds = 50;

      await diamond.addDiamonds(baseDiamonds, 'fromInvites');
      diamond.referralCount += 1;
      diamond.referralBonus += baseDiamonds;
      await diamond.save();

      // Record transaction
      await DiamondTransaction.create({
        userId,
        transactionType: 'earn',
        amount: baseDiamonds,
        source: 'invite',
        description: 'Earned diamonds from referring a friend',
        relatedUserId: referredUserId,
        balanceBefore: diamond.totalDiamonds - baseDiamonds,
        balanceAfter: diamond.totalDiamonds,
        multiplier: diamond.diamondMultiplier,
        baseAmount: baseDiamonds / diamond.diamondMultiplier,
      });

      return { diamonds: baseDiamonds, newBalance: diamond.totalDiamonds };
    } catch (error) {
      console.error('Error earning from referral:', error);
      throw error;
    }
  }

  /**
   * Spend diamonds on shop item
   */
  static async spendDiamonds(userId, amount, reason = 'purchase', relatedItemId = null) {
    try {
      const diamond = await Diamond.findOne({ userId });
      if (!diamond) throw new Error('Diamond profile not found');

      const balanceBefore = diamond.totalDiamonds;
      await diamond.spendDiamonds(amount, reason);

      // Record transaction
      await DiamondTransaction.create({
        userId,
        transactionType: 'spend',
        amount,
        source: reason,
        description: `Spent diamonds on ${reason}`,
        relatedShopItemId: relatedItemId,
        balanceBefore,
        balanceAfter: diamond.totalDiamonds,
      });

      return { spent: amount, newBalance: diamond.totalDiamonds };
    } catch (error) {
      console.error('Error spending diamonds:', error);
      throw error;
    }
  }

  /**
   * Add experience and handle level ups
   */
  static async addExperience(userId, amount) {
    try {
      const diamond = await Diamond.findOne({ userId });
      if (!diamond) throw new Error('Diamond profile not found');

      const oldLevel = diamond.level;
      await diamond.addExperience(amount);

      // Check if leveled up
      if (diamond.level > oldLevel) {
        // Unlock new profile items based on level
        await this.handleLevelUp(userId, diamond.level);
      }

      // Record transaction
      await DiamondTransaction.create({
        userId,
        transactionType: 'earn',
        amount: amount,
        source: 'achievement',
        description: `Earned ${amount} experience points`,
        balanceBefore: diamond.totalDiamonds - (10 * diamond.level),
        balanceAfter: diamond.totalDiamonds,
      });

      return {
        experience: amount,
        newLevel: diamond.level,
        leveledUp: diamond.level > oldLevel,
        newBalance: diamond.totalDiamonds,
      };
    } catch (error) {
      console.error('Error adding experience:', error);
      throw error;
    }
  }

  /**
   * Handle level up rewards and unlocks
   */
  static async handleLevelUp(userId, newLevel) {
    try {
      const profileEvolution = await ProfileEvolution.findOne({ userId });
      if (!profileEvolution) return;

      // Define unlocks for each level milestone
      const levelUnlocks = {
        1: { designs: ['classic'], borders: [], badges: [], effects: [] },
        5: { designs: ['neon'], borders: ['glow'], badges: ['level_10'], effects: ['glow'] },
        10: { designs: ['cyberpunk'], borders: ['neon'], badges: ['level_10'], effects: ['particles'] },
        15: { designs: ['holographic'], borders: ['animated'], badges: ['level_25'], effects: ['shimmer'] },
        20: { designs: ['cosmic'], borders: ['premium'], badges: [], effects: ['cosmic'] },
        25: { designs: ['aurora'], borders: [], badges: ['level_25'], effects: ['aurora'] },
        30: { designs: ['obsidian'], borders: ['exclusive'], badges: [], effects: ['flame'] },
        40: { designs: ['platinum'], borders: ['legendary'], badges: ['level_50'], effects: ['lightning'] },
        50: { designs: [], borders: [], badges: ['legendary'], effects: ['cosmic'] },
      };

      // Check if this level has unlocks
      if (levelUnlocks[newLevel]) {
        const unlocks = levelUnlocks[newLevel];

        // Unlock designs
        for (const design of unlocks.designs) {
          await profileEvolution.unlockItem('design', design, newLevel, 'epic');
        }

        // Unlock borders
        for (const border of unlocks.borders) {
          await profileEvolution.unlockItem('border', border, newLevel, 'epic');
        }

        // Unlock badges
        for (const badge of unlocks.badges) {
          await profileEvolution.unlockItem('badge', badge, newLevel, 'epic');
        }

        // Unlock effects
        for (const effect of unlocks.effects) {
          await profileEvolution.unlockItem('effect', effect, newLevel, 'epic');
        }

        // Record milestone
        profileEvolution.evolutionMilestones.push({
          level: newLevel,
          milestone: `Reached Level ${newLevel}`,
          description: `Unlocked new profile items at level ${newLevel}`,
          unlockedItems: unlocks,
          unlockedAt: new Date(),
        });

        await profileEvolution.save();
      }

      // Update next evolution teaser
      const nextMilestones = Object.keys(levelUnlocks)
        .map(Number)
        .filter((level) => level > newLevel)
        .sort((a, b) => a - b);

      if (nextMilestones.length > 0) {
        const nextLevel = nextMilestones[0];
        const nextUnlocks = levelUnlocks[nextLevel];
        const nextItem = nextUnlocks.designs[0] || nextUnlocks.borders[0] || 'mystery item';

        await profileEvolution.updateNextEvolutionTeaser(
          nextLevel,
          nextItem,
          `Unlock at Level ${nextLevel}`,
          nextLevel * 100
        );
      }
    } catch (error) {
      console.error('Error handling level up:', error);
      throw error;
    }
  }

  /**
   * Get user diamond profile
   */
  static async getUserDiamondProfile(userId) {
    try {
      const diamond = await Diamond.findOne({ userId }).lean();
      const profileEvolution = await ProfileEvolution.findOne({ userId }).lean();

      if (!diamond) throw new Error('Diamond profile not found');

      return {
        diamond,
        profileEvolution,
      };
    } catch (error) {
      console.error('Error getting diamond profile:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard
   */
  static async getLeaderboard(limit = 50) {
    try {
      const leaderboard = await Diamond.find()
        .sort({ level: -1, totalDiamonds: -1 })
        .limit(limit)
        .populate('userId', 'username profilePicture firstName lastName')
        .lean();

      return leaderboard;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  /**
   * Apply diamond multiplier boost
   */
  static async applyMultiplier(userId, multiplier, durationHours = 24) {
    try {
      const diamond = await Diamond.findOne({ userId });
      if (!diamond) throw new Error('Diamond profile not found');

      await diamond.applyMultiplier(multiplier, durationHours);

      return {
        multiplier,
        expiresAt: diamond.multiplierExpires,
      };
    } catch (error) {
      console.error('Error applying multiplier:', error);
      throw error;
    }
  }

  /**
   * Check and clean expired boosts
   */
  static async checkExpiredBoosts(userId) {
    try {
      const diamond = await Diamond.findOne({ userId });
      if (!diamond) throw new Error('Diamond profile not found');

      await diamond.checkExpiredBoosts();
      return diamond;
    } catch (error) {
      console.error('Error checking expired boosts:', error);
      throw error;
    }
  }
}

export default DiamondService;
