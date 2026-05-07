import express from 'express';
import { authenticate } from '../middleware/auth.js';
import ProfileEvolution from '../models/ProfileEvolution.js';

const router = express.Router();

/**
 * @route   GET /api/profile-evolution/:userId
 * @desc    Get user's profile evolution
 * @access  Public
 */
router.get('/:userId', async (req, res) => {
  try {
    const profileEvolution = await ProfileEvolution.findOne({ userId: req.params.userId });

    if (!profileEvolution) {
      return res.status(404).json({
        success: false,
        message: 'Profile evolution not found',
      });
    }

    res.json({
      success: true,
      profileEvolution,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile evolution',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/profile-evolution/my/profile
 * @desc    Get current user's profile evolution
 * @access  Private
 */
router.get('/my/profile', authenticate, async (req, res) => {
  try {
    const profileEvolution = await ProfileEvolution.findOne({ userId: req.userId });

    if (!profileEvolution) {
      return res.status(404).json({
        success: false,
        message: 'Profile evolution not found',
      });
    }

    res.json({
      success: true,
      profileEvolution,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile evolution',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/profile-evolution/customize
 * @desc    Customize profile
 * @access  Private
 */
router.post('/customize', authenticate, async (req, res) => {
  try {
    const { design, border, badges, effects } = req.body;

    const profileEvolution = await ProfileEvolution.findOne({ userId: req.userId });

    if (!profileEvolution) {
      return res.status(404).json({
        success: false,
        message: 'Profile evolution not found',
      });
    }

    await profileEvolution.setCustomization(design, border, badges, effects);

    res.json({
      success: true,
      message: 'Profile customized successfully',
      profileEvolution,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/profile-evolution/unlocked-items
 * @desc    Get all unlocked items
 * @access  Private
 */
router.get('/unlocked-items', authenticate, async (req, res) => {
  try {
    const profileEvolution = await ProfileEvolution.findOne({ userId: req.userId });

    if (!profileEvolution) {
      return res.status(404).json({
        success: false,
        message: 'Profile evolution not found',
      });
    }

    const unlockedItems = {
      designs: profileEvolution.unlockedDesigns,
      borders: profileEvolution.unlockedBorders,
      badges: profileEvolution.unlockedBadges,
      effects: profileEvolution.unlockedEffects,
    };

    res.json({
      success: true,
      unlockedItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unlocked items',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/profile-evolution/next-evolution
 * @desc    Get next evolution teaser
 * @access  Private
 */
router.get('/next-evolution', authenticate, async (req, res) => {
  try {
    const profileEvolution = await ProfileEvolution.findOne({ userId: req.userId });

    if (!profileEvolution) {
      return res.status(404).json({
        success: false,
        message: 'Profile evolution not found',
      });
    }

    res.json({
      success: true,
      nextEvolution: profileEvolution.nextEvolutionTeaser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch next evolution',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/profile-evolution/milestones
 * @desc    Get evolution milestones
 * @access  Private
 */
router.get('/milestones', authenticate, async (req, res) => {
  try {
    const profileEvolution = await ProfileEvolution.findOne({ userId: req.userId });

    if (!profileEvolution) {
      return res.status(404).json({
        success: false,
        message: 'Profile evolution not found',
      });
    }

    res.json({
      success: true,
      milestones: profileEvolution.evolutionMilestones,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch milestones',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/profile-evolution/mystery-unlocks
 * @desc    Get mystery unlocks
 * @access  Private
 */
router.get('/mystery-unlocks', authenticate, async (req, res) => {
  try {
    const profileEvolution = await ProfileEvolution.findOne({ userId: req.userId });

    if (!profileEvolution) {
      return res.status(404).json({
        success: false,
        message: 'Profile evolution not found',
      });
    }

    res.json({
      success: true,
      mysteryUnlocks: profileEvolution.mysteryUnlocks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mystery unlocks',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/profile-evolution/record-view
 * @desc    Record profile view
 * @access  Private
 */
router.post('/record-view', authenticate, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const profileEvolution = await ProfileEvolution.findOne({ userId });

    if (!profileEvolution) {
      return res.status(404).json({
        success: false,
        message: 'Profile evolution not found',
      });
    }

    await profileEvolution.recordProfileView();

    res.json({
      success: true,
      message: 'Profile view recorded',
      views: profileEvolution.profileViews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to record profile view',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/profile-evolution/record-like
 * @desc    Record profile like
 * @access  Private
 */
router.post('/record-like', authenticate, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const profileEvolution = await ProfileEvolution.findOne({ userId });

    if (!profileEvolution) {
      return res.status(404).json({
        success: false,
        message: 'Profile evolution not found',
      });
    }

    await profileEvolution.recordProfileLike();

    res.json({
      success: true,
      message: 'Profile like recorded',
      likes: profileEvolution.profileLikes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to record profile like',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/profile-evolution/customization-history
 * @desc    Get profile customization history
 * @access  Private
 */
router.get('/customization-history', authenticate, async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const profileEvolution = await ProfileEvolution.findOne({ userId: req.userId });

    if (!profileEvolution) {
      return res.status(404).json({
        success: false,
        message: 'Profile evolution not found',
      });
    }

    const history = profileEvolution.customizationHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(parseInt(skip), parseInt(skip) + parseInt(limit));

    res.json({
      success: true,
      history,
      total: profileEvolution.customizationHistory.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customization history',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/profile-evolution/statistics
 * @desc    Get profile statistics
 * @access  Private
 */
router.get('/statistics', authenticate, async (req, res) => {
  try {
    const profileEvolution = await ProfileEvolution.findOne({ userId: req.userId });

    if (!profileEvolution) {
      return res.status(404).json({
        success: false,
        message: 'Profile evolution not found',
      });
    }

    const stats = {
      profileViews: profileEvolution.profileViews,
      profileLikes: profileEvolution.profileLikes,
      customizationCount: profileEvolution.customizationCount,
      unlockedItemsCount: {
        designs: profileEvolution.unlockedDesigns.length,
        borders: profileEvolution.unlockedBorders.length,
        badges: profileEvolution.unlockedBadges.length,
        effects: profileEvolution.unlockedEffects.length,
      },
      totalUnlockedItems:
        profileEvolution.unlockedDesigns.length +
        profileEvolution.unlockedBorders.length +
        profileEvolution.unlockedBadges.length +
        profileEvolution.unlockedEffects.length,
    };

    res.json({
      success: true,
      statistics: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
});

export default router;
