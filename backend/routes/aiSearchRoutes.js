import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Reel from '../models/Reel.js';
import Product from '../models/Product.js';

const router = express.Router();

/**
 * @route   GET /api/ai/search
 * @desc    Smart search across all content
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { q, type = 'all', limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const searchRegex = { $regex: q, $options: 'i' };
    const results = {
      posts: [],
      users: [],
      reels: [],
      products: [],
    };

    if (type === 'all' || type === 'posts') {
      results.posts = await Post.find({
        $or: [
          { title: searchRegex },
          { content: searchRegex },
          { tags: searchRegex },
        ],
      })
        .populate('author', 'firstName lastName profilePicture')
        .limit(limit);
    }

    if (type === 'all' || type === 'users') {
      results.users = await User.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { username: searchRegex },
          { bio: searchRegex },
        ],
      })
        .select('firstName lastName profilePicture bio followers')
        .limit(limit);
    }

    if (type === 'all' || type === 'reels') {
      results.reels = await Reel.find({
        $or: [
          { caption: searchRegex },
          { tags: searchRegex },
        ],
      })
        .populate('author', 'firstName lastName profilePicture')
        .limit(limit);
    }

    if (type === 'all' || type === 'products') {
      results.products = await Product.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { tags: searchRegex },
        ],
      })
        .populate('seller', 'firstName lastName profilePicture')
        .limit(limit);
    }

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/ai/search/trending
 * @desc    Get trending searches and hashtags
 * @access  Public
 */
router.get('/search/trending', async (req, res) => {
  try {
    // Get trending posts
    const trendingPosts = await Post.find()
      .sort({ likes: -1, views: -1 })
      .limit(10)
      .select('title tags likes views');

    // Get trending hashtags
    const allPosts = await Post.find().select('tags');
    const tagFrequency = {};

    allPosts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => {
          tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
        });
      }
    });

    const trendingTags = Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    res.json({
      success: true,
      trending: {
        posts: trendingPosts,
        hashtags: trendingTags,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/ai/search/history
 * @desc    Save search to history
 * @access  Private
 */
router.post('/search/history', authenticate, async (req, res) => {
  try {
    const { query, type } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query is required',
      });
    }

    const user = await User.findById(req.userId);

    if (!user.searchHistory) {
      user.searchHistory = [];
    }

    user.searchHistory.push({
      query,
      type: type || 'all',
      searchedAt: new Date(),
    });

    // Keep only last 50 searches
    if (user.searchHistory.length > 50) {
      user.searchHistory = user.searchHistory.slice(-50);
    }

    await user.save();

    res.json({
      success: true,
      message: 'Search saved to history',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save search history',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/ai/search/history
 * @desc    Get user search history
 * @access  Private
 */
router.get('/search/history', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('searchHistory');

    res.json({
      success: true,
      history: user.searchHistory || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch search history',
      error: error.message,
    });
  }
});

export default router;
