import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Analytics from '../models/Analytics.js';
import Post from '../models/Post.js';
import Reel from '../models/Reel.js';

const router = express.Router();

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get creator analytics dashboard
 * @access  Private
 */
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    let startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);

    const analytics = await Analytics.findOne({ creator: req.userId });

    const posts = await Post.find({
      author: req.userId,
      createdAt: { $gte: startDate },
    });

    const reels = await Reel.find({
      author: req.userId,
      createdAt: { $gte: startDate },
    });

    const totalLikes = posts.reduce((sum, post) => sum + post.likes.length, 0) +
                       reels.reduce((sum, reel) => sum + reel.likes.length, 0);

    const totalComments = posts.reduce((sum, post) => sum + post.comments.length, 0) +
                          reels.reduce((sum, reel) => sum + reel.comments.length, 0);

    res.json({
      success: true,
      analytics: {
        totalFollowers: analytics?.totalFollowers || 0,
        totalViews: analytics?.totalViews || 0,
        totalLikes,
        totalComments,
        engagementRate: analytics?.engagementRate || 0,
        averageViewsPerPost: posts.length > 0 ? Math.round(analytics?.totalViews / posts.length) : 0,
        topPost: posts.sort((a, b) => b.likes.length - a.likes.length)[0] || null,
        topReel: reels.sort((a, b) => b.likes.length - a.likes.length)[0] || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/analytics/posts
 * @desc    Get analytics for all posts
 * @access  Private
 */
router.get('/posts', authenticate, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.userId })
      .select('title likes comments views createdAt')
      .sort({ createdAt: -1 });

    const postsAnalytics = posts.map(post => ({
      _id: post._id,
      title: post.title,
      likes: post.likes.length,
      comments: post.comments.length,
      views: post.views || 0,
      engagement: post.likes.length + post.comments.length,
      createdAt: post.createdAt,
    }));

    res.json({
      success: true,
      posts: postsAnalytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post analytics',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/analytics/audience
 * @desc    Get audience demographics
 * @access  Private
 */
router.get('/audience', authenticate, async (req, res) => {
  try {
    const analytics = await Analytics.findOne({ creator: req.userId });

    res.json({
      success: true,
      audience: {
        totalFollowers: analytics?.totalFollowers || 0,
        topCountries: analytics?.topCountries || [],
        topCities: analytics?.topCities || [],
        ageGroups: analytics?.ageGroups || {},
        genderDistribution: analytics?.genderDistribution || {},
        topFollowerSources: analytics?.topFollowerSources || [],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audience analytics',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/analytics/track-view
 * @desc    Track post/reel view
 * @access  Private
 */
router.post('/track-view', authenticate, async (req, res) => {
  try {
    const { contentId, contentType, duration } = req.body;

    if (!contentId || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'Content ID and type are required',
      });
    }

    let analytics = await Analytics.findOne({ creator: req.userId });

    if (!analytics) {
      analytics = new Analytics({
        creator: req.userId,
        totalViews: 1,
      });
    } else {
      analytics.totalViews += 1;
    }

    analytics.viewHistory.push({
      contentId,
      contentType,
      duration: duration || 0,
      viewedAt: new Date(),
    });

    await analytics.save();

    res.json({
      success: true,
      message: 'View tracked',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to track view',
      error: error.message,
    });
  }
});

export default router;
