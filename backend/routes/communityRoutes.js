import express from 'express';
import GroupService from '../services/GroupService.js';
import HashtagService from '../services/HashtagService.js';
import BookmarkService from '../services/BookmarkService.js';
import { verifyFirebaseAuth, isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// ==================== GROUPS ====================

// Create group
router.post('/groups/create', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const { name, description, category, isPrivate, coverImage } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required',
      });
    }

    const result = await GroupService.createGroup(req.user._id, {
      name,
      description,
      category,
      isPrivate: isPrivate || false,
      coverImage,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get all groups
router.get('/groups', async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const skip = req.query.skip || 0;
    const result = await GroupService.getAllGroups({}, limit, skip);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get group by ID
router.get('/groups/:groupId', async (req, res) => {
  try {
    const group = await GroupService.getGroupById(req.params.groupId);
    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get user's groups
router.get('/groups/user/:userId', async (req, res) => {
  try {
    const groups = await GroupService.getUserGroups(req.params.userId);
    res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Join group
router.post('/groups/:groupId/join', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const result = await GroupService.joinGroup(req.params.groupId, req.user._id);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Leave group
router.post('/groups/:groupId/leave', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const result = await GroupService.leaveGroup(req.params.groupId, req.user._id);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get trending groups
router.get('/groups/trending/all', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const groups = await GroupService.getTrendingGroups(limit);
    res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Search groups
router.get('/groups/search/:query', async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const groups = await GroupService.searchGroups(req.params.query, limit);
    res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== HASHTAGS ====================

// Get trending hashtags
router.get('/hashtags/trending', async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const hashtags = await HashtagService.getTrendingHashtags(limit);
    res.status(200).json({
      success: true,
      data: hashtags,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Search hashtags
router.get('/hashtags/search/:query', async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const hashtags = await HashtagService.searchHashtags(req.params.query, limit);
    res.status(200).json({
      success: true,
      data: hashtags,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get posts by hashtag
router.get('/hashtags/:tag/posts', async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const skip = req.query.skip || 0;
    const result = await HashtagService.getPostsByHashtag(req.params.tag, limit, skip);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get hashtag statistics
router.get('/hashtags/:hashtagId/stats', async (req, res) => {
  try {
    const stats = await HashtagService.getHashtagStats(req.params.hashtagId);
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get related hashtags
router.get('/hashtags/:tag/related', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const hashtags = await HashtagService.getRelatedHashtags(req.params.tag, limit);
    res.status(200).json({
      success: true,
      data: hashtags,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== BOOKMARKS ====================

// Create bookmark
router.post('/bookmarks/create', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Bookmark name is required',
      });
    }

    const result = await BookmarkService.createBookmark(req.user._id, {
      name,
      description,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get user bookmarks
router.get('/bookmarks', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const skip = req.query.skip || 0;
    const result = await BookmarkService.getUserBookmarks(req.user._id, limit, skip);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Quick save item
router.post('/bookmarks/save', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const { itemId, itemType } = req.body;

    if (!itemId || !itemType) {
      return res.status(400).json({
        success: false,
        message: 'Item ID and type are required',
      });
    }

    const result = await BookmarkService.quickSaveItem(req.user._id, itemId, itemType);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Quick remove item
router.post('/bookmarks/remove', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Item ID is required',
      });
    }

    const result = await BookmarkService.quickRemoveItem(req.user._id, itemId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Check if item is bookmarked
router.get('/bookmarks/check/:itemId', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const isBookmarked = await BookmarkService.isItemBookmarked(req.user._id, req.params.itemId);
    res.status(200).json({
      success: true,
      data: { isBookmarked },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get bookmark statistics
router.get('/bookmarks/stats', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const stats = await BookmarkService.getBookmarkStats(req.user._id);
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
