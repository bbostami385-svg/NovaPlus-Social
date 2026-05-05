import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Reel from '../models/Reel.js';

const router = express.Router();

/**
 * @route   GET /api/ai/recommendations/posts
 * @desc    Get AI recommended posts
 * @access  Private
 */
router.get('/recommendations/posts', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const userInterests = user.interests || [];

    // Find posts matching user interests
    let query = {};
    if (userInterests.length > 0) {
      query.tags = { $in: userInterests };
    }

    const recommendedPosts = await Post.find(query)
      .populate('author', 'firstName lastName profilePicture')
      .sort({ likes: -1, createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      posts: recommendedPosts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/ai/recommendations/users
 * @desc    Get AI recommended users to follow
 * @access  Private
 */
router.get('/recommendations/users', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const following = user.following || [];

    // Find users with similar interests
    const recommendedUsers = await User.find({
      _id: { $nin: [req.userId, ...following] },
      interests: { $in: user.interests || [] },
    })
      .select('firstName lastName profilePicture bio followers')
      .limit(10);

    res.json({
      success: true,
      users: recommendedUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user recommendations',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/ai/recommendations/products
 * @desc    Get AI recommended products
 * @access  Private
 */
router.get('/recommendations/products', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    // Get user's purchase history to recommend similar products
    const recommendedProducts = await Product.find()
      .populate('seller', 'firstName lastName profilePicture')
      .sort({ averageRating: -1, reviews: -1 })
      .limit(20);

    res.json({
      success: true,
      products: recommendedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product recommendations',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/ai/content-moderation
 * @desc    Check content for moderation
 * @access  Private
 */
router.post('/content-moderation', authenticate, async (req, res) => {
  try {
    const { content, contentType = 'text' } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
      });
    }

    // Simple moderation check (in production, use ML model)
    const bannedWords = ['spam', 'abuse', 'hate']; // Example
    const isSafe = !bannedWords.some(word => 
      content.toLowerCase().includes(word)
    );

    res.json({
      success: true,
      isSafe,
      score: isSafe ? 1.0 : 0.3,
      reason: isSafe ? 'Content is safe' : 'Content may violate guidelines',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to moderate content',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/ai/sentiment-analysis
 * @desc    Analyze sentiment of content
 * @access  Private
 */
router.post('/sentiment-analysis', authenticate, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required',
      });
    }

    // Simple sentiment analysis (in production, use ML model)
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'worst'];

    const positiveCount = positiveWords.filter(word => 
      text.toLowerCase().includes(word)
    ).length;

    const negativeCount = negativeWords.filter(word => 
      text.toLowerCase().includes(word)
    ).length;

    let sentiment = 'neutral';
    let score = 0.5;

    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = 0.7 + (positiveCount * 0.1);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score = 0.3 - (negativeCount * 0.1);
    }

    res.json({
      success: true,
      sentiment,
      score: Math.min(Math.max(score, 0), 1),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to analyze sentiment',
      error: error.message,
    });
  }
});

export default router;
