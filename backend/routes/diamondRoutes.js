import express from 'express';
import { authenticate } from '../middleware/auth.js';
import DiamondService from '../services/DiamondService.js';
import Diamond from '../models/Diamond.js';
import DiamondTransaction from '../models/DiamondTransaction.js';

const router = express.Router();

/**
 * @route   GET /api/diamond/profile
 * @desc    Get user's diamond profile
 * @access  Private
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const profile = await DiamondService.getUserDiamondProfile(req.userId);

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch diamond profile',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/diamond/initialize
 * @desc    Initialize diamond profile for new user
 * @access  Private
 */
router.post('/initialize', authenticate, async (req, res) => {
  try {
    const diamond = await DiamondService.initializeDiamondProfile(req.userId);

    res.status(201).json({
      success: true,
      message: 'Diamond profile initialized',
      diamond,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to initialize diamond profile',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/diamond/earn/post
 * @desc    Earn diamonds from creating a post
 * @access  Private
 */
router.post('/earn/post', authenticate, async (req, res) => {
  try {
    const { engagementScore = 1 } = req.body;

    const result = await DiamondService.earnFromPost(req.userId, engagementScore);

    res.json({
      success: true,
      message: 'Diamonds earned from post',
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to earn diamonds from post',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/diamond/earn/like
 * @desc    Earn diamonds from liking content
 * @access  Private
 */
router.post('/earn/like', authenticate, async (req, res) => {
  try {
    const { contentType = 'post' } = req.body;

    const result = await DiamondService.earnFromLike(req.userId, contentType);

    res.json({
      success: true,
      message: 'Diamonds earned from like',
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to earn diamonds from like',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/diamond/earn/share
 * @desc    Earn diamonds from sharing content
 * @access  Private
 */
router.post('/earn/share', authenticate, async (req, res) => {
  try {
    const { contentType = 'post' } = req.body;

    const result = await DiamondService.earnFromShare(req.userId, contentType);

    res.json({
      success: true,
      message: 'Diamonds earned from share',
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to earn diamonds from share',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/diamond/claim-daily-bonus
 * @desc    Claim daily login bonus
 * @access  Private
 */
router.post('/claim-daily-bonus', authenticate, async (req, res) => {
  try {
    const result = await DiamondService.claimDailyBonus(req.userId);

    res.json({
      success: true,
      message: 'Daily bonus claimed',
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
 * @route   POST /api/diamond/earn/referral
 * @desc    Earn diamonds from referring a friend
 * @access  Private
 */
router.post('/earn/referral', authenticate, async (req, res) => {
  try {
    const { referredUserId } = req.body;

    if (!referredUserId) {
      return res.status(400).json({
        success: false,
        message: 'Referred user ID is required',
      });
    }

    const result = await DiamondService.earnFromReferral(req.userId, referredUserId);

    res.json({
      success: true,
      message: 'Diamonds earned from referral',
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to earn diamonds from referral',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/diamond/spend
 * @desc    Spend diamonds
 * @access  Private
 */
router.post('/spend', authenticate, async (req, res) => {
  try {
    const { amount, reason = 'purchase', relatedItemId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }

    const result = await DiamondService.spendDiamonds(req.userId, amount, reason, relatedItemId);

    res.json({
      success: true,
      message: 'Diamonds spent',
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
 * @route   POST /api/diamond/add-experience
 * @desc    Add experience points
 * @access  Private
 */
router.post('/add-experience', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }

    const result = await DiamondService.addExperience(req.userId, amount);

    res.json({
      success: true,
      message: 'Experience added',
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add experience',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/diamond/leaderboard
 * @desc    Get diamond leaderboard
 * @access  Public
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const leaderboard = await DiamondService.getLeaderboard(parseInt(limit));

    res.json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/diamond/transactions
 * @desc    Get user's diamond transaction history
 * @access  Private
 */
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    const transactions = await DiamondTransaction.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await DiamondTransaction.countDocuments({ userId: req.userId });

    res.json({
      success: true,
      transactions,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/diamond/summary
 * @desc    Get diamond earning/spending summary
 * @access  Private
 */
router.get('/summary', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const summary = await DiamondTransaction.getUserSummary(req.userId, parseInt(days));
    const earningBreakdown = await DiamondTransaction.getEarningBreakdown(req.userId, parseInt(days));
    const spendingBreakdown = await DiamondTransaction.getSpendingBreakdown(req.userId, parseInt(days));
    const dailyTrend = await DiamondTransaction.getDailyEarningTrend(req.userId, parseInt(days));

    res.json({
      success: true,
      summary,
      earningBreakdown,
      spendingBreakdown,
      dailyTrend,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch summary',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/diamond/apply-multiplier
 * @desc    Apply diamond multiplier boost
 * @access  Private
 */
router.post('/apply-multiplier', authenticate, async (req, res) => {
  try {
    const { multiplier, durationHours = 24 } = req.body;

    if (!multiplier || multiplier < 1 || multiplier > 5) {
      return res.status(400).json({
        success: false,
        message: 'Multiplier must be between 1 and 5',
      });
    }

    const result = await DiamondService.applyMultiplier(req.userId, multiplier, durationHours);

    res.json({
      success: true,
      message: 'Multiplier applied',
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to apply multiplier',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/diamond/check-daily-bonus
 * @desc    Check if user can claim daily bonus
 * @access  Private
 */
router.get('/check-daily-bonus', authenticate, async (req, res) => {
  try {
    const diamond = await Diamond.findOne({ userId: req.userId });

    if (!diamond) {
      return res.status(404).json({
        success: false,
        message: 'Diamond profile not found',
      });
    }

    const canClaim = diamond.canClaimDailyBonus();
    const nextClaimTime = diamond.lastLoginDate
      ? new Date(diamond.lastLoginDate).setDate(new Date(diamond.lastLoginDate).getDate() + 1)
      : null;

    res.json({
      success: true,
      canClaim,
      nextClaimTime,
      streak: diamond.dailyLoginStreak,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check daily bonus',
      error: error.message,
    });
  }
});

export default router;
