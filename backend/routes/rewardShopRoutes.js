import express from 'express';
import { authenticate } from '../middleware/auth.js';
import RewardShopService from '../services/RewardShopService.js';
import RewardShop from '../models/RewardShop.js';

const router = express.Router();

/**
 * @route   GET /api/reward-shop/items
 * @desc    Get all available shop items
 * @access  Public
 */
router.get('/items', async (req, res) => {
  try {
    const { category, itemType, rarity } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (itemType) filters.itemType = itemType;
    if (rarity) filters.rarity = rarity;

    const items = await RewardShopService.getAvailableItems(filters);

    res.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shop items',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/reward-shop/featured
 * @desc    Get featured shop items
 * @access  Public
 */
router.get('/featured', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const items = await RewardShopService.getFeaturedItems(parseInt(limit));

    res.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured items',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/reward-shop/sale
 * @desc    Get items on sale
 * @access  Public
 */
router.get('/sale', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const items = await RewardShopService.getSaleItems(parseInt(limit));

    res.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sale items',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/reward-shop/mystery-boxes
 * @desc    Get mystery boxes
 * @access  Public
 */
router.get('/mystery-boxes', async (req, res) => {
  try {
    const boxes = await RewardShopService.getMysteryBoxes();

    res.json({
      success: true,
      boxes,
      count: boxes.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mystery boxes',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/reward-shop/item/:id
 * @desc    Get specific shop item
 * @access  Public
 */
router.get('/item/:id', async (req, res) => {
  try {
    const item = await RewardShopService.getShopItem(req.params.id);

    res.json({
      success: true,
      item,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'Shop item not found',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/reward-shop/search
 * @desc    Search shop items
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const items = await RewardShopService.searchItems(q, parseInt(limit));

    res.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to search items',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/reward-shop/category/:category
 * @desc    Get items by category
 * @access  Public
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const items = await RewardShopService.getItemsByCategory(req.params.category, parseInt(limit));

    res.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items by category',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/reward-shop/rarity/:rarity
 * @desc    Get items by rarity
 * @access  Public
 */
router.get('/rarity/:rarity', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const items = await RewardShopService.getItemsByRarity(req.params.rarity, parseInt(limit));

    res.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items by rarity',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/reward-shop/purchase
 * @desc    Purchase shop item
 * @access  Private
 */
router.post('/purchase', authenticate, async (req, res) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Item ID is required',
      });
    }

    const result = await RewardShopService.purchaseItem(req.userId, itemId);

    res.json({
      success: true,
      message: 'Item purchased successfully',
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/reward-shop/open-mystery-box
 * @desc    Open mystery box
 * @access  Private
 */
router.post('/open-mystery-box', authenticate, async (req, res) => {
  try {
    const { boxId } = req.body;

    if (!boxId) {
      return res.status(400).json({
        success: false,
        message: 'Box ID is required',
      });
    }

    const result = await RewardShopService.openMysteryBox(req.userId, boxId);

    res.json({
      success: true,
      message: 'Mystery box opened',
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/reward-shop/statistics
 * @desc    Get shop statistics
 * @access  Public
 */
router.get('/statistics', async (req, res) => {
  try {
    const stats = await RewardShopService.getShopStatistics();

    res.json({
      success: true,
      statistics: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/reward-shop/create (Admin)
 * @desc    Create new shop item
 * @access  Private (Admin only)
 */
router.post('/create', authenticate, async (req, res) => {
  try {
    // TODO: Add admin role check
    const itemData = req.body;

    const item = await RewardShopService.createShopItem(itemData);

    res.status(201).json({
      success: true,
      message: 'Shop item created',
      item,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create shop item',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/reward-shop/update/:id (Admin)
 * @desc    Update shop item
 * @access  Private (Admin only)
 */
router.put('/update/:id', authenticate, async (req, res) => {
  try {
    // TODO: Add admin role check
    const item = await RewardShopService.updateShopItem(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Shop item updated',
      item,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update shop item',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/reward-shop/delete/:id (Admin)
 * @desc    Delete shop item
 * @access  Private (Admin only)
 */
router.delete('/delete/:id', authenticate, async (req, res) => {
  try {
    // TODO: Add admin role check
    const item = await RewardShopService.deleteShopItem(req.params.id);

    res.json({
      success: true,
      message: 'Shop item deleted',
      item,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to delete shop item',
      error: error.message,
    });
  }
});

export default router;
