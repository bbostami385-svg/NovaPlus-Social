import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Challenge from '../models/Challenge.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * @route   POST /api/challenges/create
 * @desc    Create a new challenge
 * @access  Private (Admin)
 */
router.post('/create', authenticate, async (req, res) => {
  try {
    const { title, description, reward, duration, category, rules = [] } = req.body;

    if (!title || !reward || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Title, reward, and duration are required',
      });
    }

    const challenge = new Challenge({
      title,
      description,
      reward,
      duration,
      category,
      rules,
      startDate: new Date(),
      endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
    });

    await challenge.save();

    res.status(201).json({
      success: true,
      challenge,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create challenge',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/challenges/active
 * @desc    Get active challenges
 * @access  Public
 */
router.get('/active', async (req, res) => {
  try {
    const challenges = await Challenge.find({
      endDate: { $gt: new Date() },
      status: 'active',
    }).sort({ endDate: 1 });

    res.json({
      success: true,
      challenges,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch challenges',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/challenges/:challengeId/join
 * @desc    Join a challenge
 * @access  Private
 */
router.post('/:challengeId/join', authenticate, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
      });
    }

    if (challenge.participants.includes(req.userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already joined this challenge',
      });
    }

    challenge.participants.push(req.userId);
    await challenge.save();

    res.json({
      success: true,
      message: 'Joined challenge',
      participants: challenge.participants.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to join challenge',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/challenges/:challengeId/submit
 * @desc    Submit challenge entry
 * @access  Private
 */
router.post('/:challengeId/submit', authenticate, async (req, res) => {
  try {
    const { content, mediaUrl } = req.body;

    const challenge = await Challenge.findById(req.params.challengeId);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
      });
    }

    challenge.submissions.push({
      participant: req.userId,
      content,
      mediaUrl,
      submittedAt: new Date(),
    });

    await challenge.save();

    res.status(201).json({
      success: true,
      message: 'Submission received',
      submission: challenge.submissions[challenge.submissions.length - 1],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit entry',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/challenges/:challengeId/leaderboard
 * @desc    Get challenge leaderboard
 * @access  Public
 */
router.get('/:challengeId/leaderboard', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId)
      .populate('submissions.participant', 'firstName lastName profilePicture');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
      });
    }

    // Sort submissions by votes
    const leaderboard = challenge.submissions
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 10);

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
