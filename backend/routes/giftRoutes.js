import express from 'express';
import GiftService from '../services/GiftService.js';
import { verifyFirebaseAuth, isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// ==================== GIFTS ====================

// Get all gifts
router.get('/', async (req, res) => {
  try {
    const gifts = await GiftService.getAllGifts();
    res.status(200).json({
      success: true,
      data: gifts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get gift by ID
router.get('/:giftId', async (req, res) => {
  try {
    const gift = await GiftService.getGiftById(req.params.giftId);
    res.status(200).json({
      success: true,
      data: gift,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get gifts by category
router.get('/category/:category', async (req, res) => {
  try {
    const gifts = await GiftService.getGiftsByCategory(req.params.category);
    res.status(200).json({
      success: true,
      data: gifts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get gift categories
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await GiftService.getGiftCategories();
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Send gift
router.post('/send', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const { receiverId, giftId, message } = req.body;

    if (!receiverId || !giftId) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and Gift ID are required',
      });
    }

    const result = await GiftService.sendGift(req.user._id, receiverId, giftId, message);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get user's received gifts
router.get('/received/:userId', async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const gifts = await GiftService.getUserReceivedGifts(req.params.userId, limit);
    res.status(200).json({
      success: true,
      data: gifts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get user's sent gifts
router.get('/sent/:userId', async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const gifts = await GiftService.getUserSentGifts(req.params.userId, limit);
    res.status(200).json({
      success: true,
      data: gifts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get gift leaderboard
router.get('/leaderboard/top', async (req, res) => {
  try {
    const limit = req.query.limit || 100;
    const leaderboard = await GiftService.getGiftLeaderboard(limit);
    res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get trending gifts
router.get('/trending/all', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const gifts = await GiftService.getTrendingGifts(limit);
    res.status(200).json({
      success: true,
      data: gifts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Initialize default gifts
router.post('/initialize', async (req, res) => {
  try {
    const result = await GiftService.initializeDefaultGifts();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
