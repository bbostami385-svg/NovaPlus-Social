import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Story from '../models/Story.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * @route   POST /api/stories/create
 * @desc    Create a new story
 * @access  Private
 */
router.post('/create', authenticate, async (req, res) => {
  try {
    const { mediaUrl, mediaType = 'image', caption = '', duration = 5 } = req.body;

    if (!mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Media URL is required',
      });
    }

    const story = new Story({
      author: req.userId,
      mediaUrl,
      mediaType,
      caption,
      duration,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await story.save();

    res.status(201).json({
      success: true,
      story,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create story',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/stories/feed
 * @desc    Get stories from followed users
 * @access  Private
 */
router.get('/feed', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const followingIds = user.following || [];
    followingIds.push(req.userId); // Include own stories

    const stories = await Story.find({
      author: { $in: followingIds },
      expiresAt: { $gt: new Date() },
    })
      .populate('author', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      stories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stories',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/stories/:storyId/view
 * @desc    Mark story as viewed
 * @access  Private
 */
router.post('/:storyId/view', authenticate, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    if (!story.views.includes(req.userId)) {
      story.views.push(req.userId);
      await story.save();
    }

    res.json({
      success: true,
      message: 'Story viewed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark story as viewed',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/stories/:storyId
 * @desc    Delete a story
 * @access  Private
 */
router.delete('/:storyId', authenticate, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    if (story.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this story',
      });
    }

    await Story.findByIdAndDelete(req.params.storyId);

    res.json({
      success: true,
      message: 'Story deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete story',
      error: error.message,
    });
  }
});

export default router;
