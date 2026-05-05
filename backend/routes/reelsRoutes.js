import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Reel from '../models/Reel.js';

const router = express.Router();

/**
 * @route   POST /api/reels/create
 * @desc    Create a new reel (short video)
 * @access  Private
 */
router.post('/create', authenticate, async (req, res) => {
  try {
    const { videoUrl, thumbnail, caption = '', tags = [], duration = 0 } = req.body;

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Video URL is required',
      });
    }

    const reel = new Reel({
      author: req.userId,
      videoUrl,
      thumbnail,
      caption,
      tags,
      duration,
    });

    await reel.save();
    await reel.populate('author', 'firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      reel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create reel',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/reels/feed
 * @desc    Get reels feed (For You page)
 * @access  Private
 */
router.get('/feed', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reels = await Reel.find()
      .populate('author', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Reel.countDocuments();

    res.json({
      success: true,
      reels,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reels',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/reels/:reelId/like
 * @desc    Like a reel
 * @access  Private
 */
router.post('/:reelId/like', authenticate, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.reelId);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found',
      });
    }

    if (reel.likes.includes(req.userId)) {
      reel.likes = reel.likes.filter(id => id.toString() !== req.userId);
    } else {
      reel.likes.push(req.userId);
    }

    await reel.save();

    res.json({
      success: true,
      likes: reel.likes.length,
      liked: reel.likes.includes(req.userId),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to like reel',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/reels/:reelId/comment
 * @desc    Comment on a reel
 * @access  Private
 */
router.post('/:reelId/comment', authenticate, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required',
      });
    }

    const reel = await Reel.findById(req.params.reelId);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found',
      });
    }

    reel.comments.push({
      author: req.userId,
      text,
      createdAt: new Date(),
    });

    await reel.save();

    res.status(201).json({
      success: true,
      comment: reel.comments[reel.comments.length - 1],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/reels/:reelId
 * @desc    Delete a reel
 * @access  Private
 */
router.delete('/:reelId', authenticate, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.reelId);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found',
      });
    }

    if (reel.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this reel',
      });
    }

    await Reel.findByIdAndDelete(req.params.reelId);

    res.json({
      success: true,
      message: 'Reel deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete reel',
      error: error.message,
    });
  }
});

export default router;
