import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Achievement from '../models/Achievement.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * @route   GET /api/achievements/all
 * @desc    Get all available achievements
 * @access  Public
 */
router.get('/all', async (req, res) => {
  try {
    const achievements = await Achievement.find();

    res.json({
      success: true,
      achievements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/achievements/user
 * @desc    Get user achievements
 * @access  Private
 */
router.get('/user', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('achievements.achievementId');

    res.json({
      success: true,
      achievements: user.achievements || [],
      totalPoints: user.points || 0,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user achievements',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/achievements/unlock
 * @desc    Unlock an achievement
 * @access  Private
 */
router.post('/unlock', authenticate, async (req, res) => {
  try {
    const { achievementId } = req.body;

    if (!achievementId) {
      return res.status(400).json({
        success: false,
        message: 'Achievement ID is required',
      });
    }

    const achievement = await Achievement.findById(achievementId);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found',
      });
    }

    const user = await User.findById(req.userId);

    // Check if already unlocked
    const alreadyUnlocked = user.achievements.some(
      a => a.achievementId.toString() === achievementId
    );

    if (alreadyUnlocked) {
      return res.status(400).json({
        success: false,
        message: 'Achievement already unlocked',
      });
    }

    user.achievements.push({
      achievementId,
      unlockedAt: new Date(),
    });

    user.points = (user.points || 0) + achievement.points;

    await user.save();

    res.json({
      success: true,
      message: 'Achievement unlocked!',
      achievement,
      totalPoints: user.points,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to unlock achievement',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/achievements/leaderboard
 * @desc    Get achievements leaderboard
 * @access  Public
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await User.find()
      .select('firstName lastName profilePicture points achievements')
      .sort({ points: -1 })
      .limit(100);

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

export default router;
