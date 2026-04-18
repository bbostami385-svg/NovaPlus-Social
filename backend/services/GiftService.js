import Gift from '../models/Gift.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

class GiftService {
  // Get all available gifts
  static async getAllGifts() {
    try {
      const gifts = await Gift.find({ isActive: true }).sort({ price: 1 });
      return gifts;
    } catch (error) {
      throw new Error(`Failed to fetch gifts: ${error.message}`);
    }
  }

  // Get gift by ID
  static async getGiftById(giftId) {
    try {
      const gift = await Gift.findById(giftId);
      if (!gift) {
        throw new Error('Gift not found');
      }
      return gift;
    } catch (error) {
      throw new Error(`Failed to fetch gift: ${error.message}`);
    }
  }

  // Get gifts by category
  static async getGiftsByCategory(category) {
    try {
      const gifts = await Gift.find({ category, isActive: true }).sort({ price: 1 });
      return gifts;
    } catch (error) {
      throw new Error(`Failed to fetch gifts by category: ${error.message}`);
    }
  }

  // Get gift categories
  static async getGiftCategories() {
    try {
      const categories = await Gift.distinct('category', { isActive: true });
      return categories;
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }

  // Send gift to user
  static async sendGift(senderId, receiverId, giftId, message = '') {
    try {
      const gift = await Gift.findById(giftId);
      if (!gift) {
        throw new Error('Gift not found');
      }

      const sender = await User.findById(senderId);
      if (!sender) {
        throw new Error('Sender not found');
      }

      // Check if sender has enough coins
      if (sender.coins < gift.price) {
        return {
          success: false,
          message: 'Insufficient coins to send this gift',
        };
      }

      // Deduct coins from sender
      sender.coins -= gift.price;
      await sender.save();

      // Add coins to receiver (creator gets 80% of gift price)
      const receiver = await User.findById(receiverId);
      if (receiver) {
        receiver.coins += Math.floor(gift.price * 0.8);
        receiver.totalGiftsReceived = (receiver.totalGiftsReceived || 0) + 1;
        await receiver.save();
      }

      // Update gift statistics
      gift.totalSent = (gift.totalSent || 0) + 1;
      await gift.save();

      // Create notification
      await Notification.create({
        userId: receiverId,
        type: 'gift_received',
        title: `You received a ${gift.name}!`,
        message: `${sender.firstName} sent you a ${gift.name}${message ? ': ' + message : ''}`,
        relatedUser: senderId,
        relatedGift: giftId,
        read: false,
      });

      return {
        success: true,
        message: 'Gift sent successfully',
        coinsRemaining: sender.coins,
        coinsEarned: Math.floor(gift.price * 0.8),
      };
    } catch (error) {
      throw new Error(`Failed to send gift: ${error.message}`);
    }
  }

  // Get user's received gifts
  static async getUserReceivedGifts(userId, limit = 50) {
    try {
      const notifications = await Notification.find({
        userId,
        type: 'gift_received',
      })
        .populate('relatedGift')
        .populate('relatedUser', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 })
        .limit(limit);

      return notifications;
    } catch (error) {
      throw new Error(`Failed to fetch received gifts: ${error.message}`);
    }
  }

  // Get user's sent gifts
  static async getUserSentGifts(userId, limit = 50) {
    try {
      const notifications = await Notification.find({
        relatedUser: userId,
        type: 'gift_received',
      })
        .populate('relatedGift')
        .populate('userId', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 })
        .limit(limit);

      return notifications;
    } catch (error) {
      throw new Error(`Failed to fetch sent gifts: ${error.message}`);
    }
  }

  // Get gift leaderboard
  static async getGiftLeaderboard(limit = 100) {
    try {
      const leaderboard = await User.find()
        .select('firstName lastName profilePicture totalGiftsReceived coins')
        .sort({ totalGiftsReceived: -1 })
        .limit(limit);

      return leaderboard;
    } catch (error) {
      throw new Error(`Failed to fetch gift leaderboard: ${error.message}`);
    }
  }

  // Get trending gifts
  static async getTrendingGifts(limit = 10) {
    try {
      const gifts = await Gift.find({ isActive: true })
        .sort({ totalSent: -1 })
        .limit(limit);

      return gifts;
    } catch (error) {
      throw new Error(`Failed to fetch trending gifts: ${error.message}`);
    }
  }

  // Create new gift (admin only)
  static async createGift(giftData) {
    try {
      const gift = new Gift(giftData);
      await gift.save();
      return gift;
    } catch (error) {
      throw new Error(`Failed to create gift: ${error.message}`);
    }
  }

  // Update gift (admin only)
  static async updateGift(giftId, updateData) {
    try {
      const gift = await Gift.findByIdAndUpdate(giftId, updateData, { new: true });
      if (!gift) {
        throw new Error('Gift not found');
      }
      return gift;
    } catch (error) {
      throw new Error(`Failed to update gift: ${error.message}`);
    }
  }

  // Delete gift (admin only)
  static async deleteGift(giftId) {
    try {
      const gift = await Gift.findByIdAndDelete(giftId);
      if (!gift) {
        throw new Error('Gift not found');
      }
      return { success: true, message: 'Gift deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete gift: ${error.message}`);
    }
  }

  // Initialize default gifts
  static async initializeDefaultGifts() {
    try {
      const defaultGifts = [
        {
          name: 'Rose',
          emoji: '🌹',
          category: 'flowers',
          price: 10,
          color: '#FF69B4',
          description: 'A beautiful red rose',
          isActive: true,
        },
        {
          name: 'Heart',
          emoji: '❤️',
          category: 'love',
          price: 15,
          color: '#FF0000',
          description: 'A red heart for love',
          isActive: true,
        },
        {
          name: 'Diamond',
          emoji: '💎',
          category: 'premium',
          price: 100,
          color: '#00CED1',
          description: 'A precious diamond',
          isActive: true,
        },
        {
          name: 'Rocket',
          emoji: '🚀',
          category: 'fun',
          price: 50,
          color: '#FF6347',
          description: 'To the moon!',
          isActive: true,
        },
        {
          name: 'Cake',
          emoji: '🎂',
          category: 'celebration',
          price: 25,
          color: '#FFB6C1',
          description: 'A delicious cake',
          isActive: true,
        },
        {
          name: 'Star',
          emoji: '⭐',
          category: 'special',
          price: 30,
          color: '#FFD700',
          description: 'You are a star!',
          isActive: true,
        },
        {
          name: 'Fire',
          emoji: '🔥',
          category: 'hot',
          price: 20,
          color: '#FF4500',
          description: 'You are on fire!',
          isActive: true,
        },
        {
          name: 'Crown',
          emoji: '👑',
          category: 'royal',
          price: 75,
          color: '#FFD700',
          description: 'Royal treatment',
          isActive: true,
        },
      ];

      // Check if gifts already exist
      const existingCount = await Gift.countDocuments();
      if (existingCount === 0) {
        await Gift.insertMany(defaultGifts);
        return {
          success: true,
          message: `${defaultGifts.length} default gifts created`,
        };
      }

      return {
        success: true,
        message: 'Gifts already initialized',
      };
    } catch (error) {
      throw new Error(`Failed to initialize gifts: ${error.message}`);
    }
  }
}

export default GiftService;
