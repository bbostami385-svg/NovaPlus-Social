import RewardShop from '../models/RewardShop.js';
import Diamond from '../models/Diamond.js';
import ProfileEvolution from '../models/ProfileEvolution.js';
import DiamondService from './DiamondService.js';

class RewardShopService {
  /**
   * Create shop item
   */
  static async createShopItem(itemData) {
    try {
      const item = new RewardShop(itemData);
      await item.save();
      return item;
    } catch (error) {
      console.error('Error creating shop item:', error);
      throw error;
    }
  }

  /**
   * Get all available shop items
   */
  static async getAvailableItems(filters = {}) {
    try {
      const query = { isAvailable: true };

      if (filters.category) query.category = filters.category;
      if (filters.itemType) query.itemType = filters.itemType;
      if (filters.rarity) query.rarity = filters.rarity;
      if (filters.featured) query.featured = true;

      const items = await RewardShop.find(query)
        .sort({ featured: -1, createdAt: -1 })
        .lean();

      // Add actual prices considering discounts
      return items.map((item) => ({
        ...item,
        actualPrice: this.getActualPrice(item),
      }));
    } catch (error) {
      console.error('Error getting available items:', error);
      throw error;
    }
  }

  /**
   * Get featured items
   */
  static async getFeaturedItems(limit = 10) {
    try {
      const now = new Date();
      const items = await RewardShop.find({
        isAvailable: true,
        featured: true,
        featuredUntil: { $gt: now },
      })
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      return items.map((item) => ({
        ...item,
        actualPrice: this.getActualPrice(item),
      }));
    } catch (error) {
      console.error('Error getting featured items:', error);
      throw error;
    }
  }

  /**
   * Get sale items
   */
  static async getSaleItems(limit = 20) {
    try {
      const now = new Date();
      const items = await RewardShop.find({
        isAvailable: true,
        isOnSale: true,
        saleStartDate: { $lte: now },
        saleEndDate: { $gt: now },
      })
        .limit(limit)
        .sort({ discountPercentage: -1 })
        .lean();

      return items.map((item) => ({
        ...item,
        actualPrice: this.getActualPrice(item),
      }));
    } catch (error) {
      console.error('Error getting sale items:', error);
      throw error;
    }
  }

  /**
   * Get mystery boxes
   */
  static async getMysteryBoxes() {
    try {
      const boxes = await RewardShop.find({
        isAvailable: true,
        isMysteryBox: true,
      })
        .lean();

      return boxes.map((item) => ({
        ...item,
        actualPrice: this.getActualPrice(item),
      }));
    } catch (error) {
      console.error('Error getting mystery boxes:', error);
      throw error;
    }
  }

  /**
   * Get shop item by ID
   */
  static async getShopItem(itemId) {
    try {
      const item = await RewardShop.findById(itemId).lean();
      if (!item) throw new Error('Shop item not found');

      return {
        ...item,
        actualPrice: this.getActualPrice(item),
      };
    } catch (error) {
      console.error('Error getting shop item:', error);
      throw error;
    }
  }

  /**
   * Purchase item
   */
  static async purchaseItem(userId, itemId) {
    try {
      const item = await RewardShop.findById(itemId);
      if (!item) throw new Error('Shop item not found');

      if (!item.isAvailable) throw new Error('Item is not available');
      if (!item.isInStock()) throw new Error('Item is out of stock');

      const actualPrice = this.getActualPrice(item);
      const diamond = await Diamond.findOne({ userId });
      if (!diamond) throw new Error('Diamond profile not found');

      if (diamond.totalDiamonds < actualPrice) {
        throw new Error('Insufficient diamonds');
      }

      // Deduct diamonds
      await DiamondService.spendDiamonds(userId, actualPrice, 'shop_purchase', itemId);

      // Update item
      await item.purchase();

      // Unlock item for user
      const profileEvolution = await ProfileEvolution.findOne({ userId });
      if (profileEvolution) {
        await profileEvolution.unlockItem(item.itemType, item.itemName, 0, item.rarity);
      }

      return {
        success: true,
        item: item.itemName,
        diamondSpent: actualPrice,
        newBalance: diamond.totalDiamonds - actualPrice,
      };
    } catch (error) {
      console.error('Error purchasing item:', error);
      throw error;
    }
  }

  /**
   * Open mystery box
   */
  static async openMysteryBox(userId, boxId) {
    try {
      const box = await RewardShop.findById(boxId);
      if (!box) throw new Error('Mystery box not found');
      if (!box.isMysteryBox) throw new Error('Item is not a mystery box');

      // Purchase the box first
      await this.purchaseItem(userId, boxId);

      // Determine reward
      const reward = this.selectMysteryReward(box.possibleRewards);

      // Create reward item in shop if it doesn't exist
      let rewardItem = await RewardShop.findOne({ itemName: reward.item });
      if (!rewardItem) {
        rewardItem = await this.createShopItem({
          itemName: reward.item,
          itemDescription: `Mystery reward: ${reward.item}`,
          itemType: 'effect',
          rarity: reward.rarity,
          diamondPrice: 0,
          isAvailable: true,
        });
      }

      // Unlock reward for user
      const profileEvolution = await ProfileEvolution.findOne({ userId });
      if (profileEvolution) {
        await profileEvolution.addMysteryUnlock(reward.item, 'effect', reward.rarity);
      }

      return {
        success: true,
        reward: reward.item,
        rarity: reward.rarity,
      };
    } catch (error) {
      console.error('Error opening mystery box:', error);
      throw error;
    }
  }

  /**
   * Select random reward from mystery box
   */
  static selectMysteryReward(possibleRewards) {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const reward of possibleRewards) {
      cumulative += reward.probability;
      if (random <= cumulative) {
        return reward;
      }
    }

    // Fallback to last reward
    return possibleRewards[possibleRewards.length - 1];
  }

  /**
   * Get actual price considering discounts and sales
   */
  static getActualPrice(item) {
    const now = new Date();

    // Check if discount is still active
    if (item.discountPercentage > 0 && item.discountUntil && item.discountUntil > now) {
      return Math.floor(item.diamondPrice * (1 - item.discountPercentage / 100));
    }

    // Check if sale is active
    if (item.isOnSale && item.saleStartDate && item.saleEndDate) {
      if (now >= item.saleStartDate && now <= item.saleEndDate) {
        return Math.floor(item.diamondPrice * (1 - item.discountPercentage / 100));
      }
    }

    return item.diamondPrice;
  }

  /**
   * Search shop items
   */
  static async searchItems(query, limit = 20) {
    try {
      const items = await RewardShop.find({
        isAvailable: true,
        $or: [
          { itemName: { $regex: query, $options: 'i' } },
          { itemDescription: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } },
          { searchKeywords: { $in: [new RegExp(query, 'i')] } },
        ],
      })
        .limit(limit)
        .lean();

      return items.map((item) => ({
        ...item,
        actualPrice: this.getActualPrice(item),
      }));
    } catch (error) {
      console.error('Error searching items:', error);
      throw error;
    }
  }

  /**
   * Get shop items by category
   */
  static async getItemsByCategory(category, limit = 20) {
    try {
      const items = await RewardShop.find({
        isAvailable: true,
        category,
      })
        .limit(limit)
        .sort({ featured: -1, createdAt: -1 })
        .lean();

      return items.map((item) => ({
        ...item,
        actualPrice: this.getActualPrice(item),
      }));
    } catch (error) {
      console.error('Error getting items by category:', error);
      throw error;
    }
  }

  /**
   * Get shop items by rarity
   */
  static async getItemsByRarity(rarity, limit = 20) {
    try {
      const items = await RewardShop.find({
        isAvailable: true,
        rarity,
      })
        .limit(limit)
        .sort({ featured: -1, createdAt: -1 })
        .lean();

      return items.map((item) => ({
        ...item,
        actualPrice: this.getActualPrice(item),
      }));
    } catch (error) {
      console.error('Error getting items by rarity:', error);
      throw error;
    }
  }

  /**
   * Update shop item
   */
  static async updateShopItem(itemId, updateData) {
    try {
      const item = await RewardShop.findByIdAndUpdate(itemId, updateData, { new: true });
      if (!item) throw new Error('Shop item not found');
      return item;
    } catch (error) {
      console.error('Error updating shop item:', error);
      throw error;
    }
  }

  /**
   * Delete shop item
   */
  static async deleteShopItem(itemId) {
    try {
      const item = await RewardShop.findByIdAndDelete(itemId);
      if (!item) throw new Error('Shop item not found');
      return item;
    } catch (error) {
      console.error('Error deleting shop item:', error);
      throw error;
    }
  }

  /**
   * Get shop statistics
   */
  static async getShopStatistics() {
    try {
      const stats = await RewardShop.aggregate([
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            totalPurchases: { $sum: '$purchaseCount' },
            totalDiamondSpent: { $sum: '$totalDiamondSpent' },
            averageRating: { $avg: '$averageRating' },
          },
        },
      ]);

      return stats[0] || {};
    } catch (error) {
      console.error('Error getting shop statistics:', error);
      throw error;
    }
  }
}

export default RewardShopService;
