import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Reward from '../models/Reward.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * @route   GET /api/rewards/available
 * @desc    Get available rewards
 * @access  Private
 */
router.get('/available', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const userPoints = user.points || 0;

    const rewards = await Reward.find({
      pointsRequired: { $lte: userPoints },
      status: 'active',
    }).sort({ pointsRequired: 1 });

    res.json({
      success: true,
      rewards,
      userPoints,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rewards',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/rewards/redeem
 * @desc    Redeem a reward
 * @access  Private
 */
router.post('/redeem', authenticate, async (req, res) => {
  try {
    const { rewardId } = req.body;

    if (!rewardId) {
      return res.status(400).json({
        success: false,
        message: 'Reward ID is required',
      });
    }

    const reward = await Reward.findById(rewardId);

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found',
      });
    }

    const user = await User.findById(req.userId);

    if (user.points < reward.pointsRequired) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points',
      });
    }

    // Deduct points
    user.points -= reward.pointsRequired;

    // Add reward to user's inventory
    if (!user.rewardsRedeemed) {
      user.rewardsRedeemed = [];
    }

    user.rewardsRedeemed.push({
      rewardId,
      redeemedAt: new Date(),
    });

    await user.save();

    res.json({
      success: true,
      message: 'Reward redeemed!',
      reward,
      remainingPoints: user.points,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to redeem reward',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/rewards/user-inventory
 * @desc    Get user's redeemed rewards
 * @access  Private
 */
router.get('/user-inventory', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('rewardsRedeemed.rewardId');

    res.json({
      success: true,
      rewards: user.rewardsRedeemed || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/rewards/shop
 * @desc    Get rewards shop
 * @access  Public
 */
router.get('/shop', async (req, res) => {
  try {
    const rewards = await Reward.find({ status: 'active' })
      .sort({ pointsRequired: 1 });

    res.json({
      success: true,
      rewards,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rewards shop',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/rewards/add-points
 * @desc    Add points to user (for activities)
 * @access  Private
 */
router.post('/add-points', authenticate, async (req, res) => {
  try {
    const { points, reason } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid points amount is required',
      });
    }

    const user = await User.findById(req.userId);
    user.points = (user.points || 0) + points;

    if (!user.pointsHistory) {
      user.pointsHistory = [];
    }

    user.pointsHistory.push({
      points,
      reason: reason || 'Activity',
      earnedAt: new Date(),
    });

    await user.save();

    res.json({
      success: true,
      message: 'Points added',
      totalPoints: user.points,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add points',
      error: error.message,
    });
  }
});

export default router;
