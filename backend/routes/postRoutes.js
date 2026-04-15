import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const router = express.Router();

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { content, images, videos, visibility, hashtags, mentions } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
      });
    }

    const post = new Post({
      author: req.userId,
      content,
      images: images || [],
      videos: videos || [],
      visibility: visibility || 'public',
      hashtags: hashtags || [],
      mentions: mentions || [],
    });

    await post.save();
    await post.populate('author', 'firstName lastName username profilePicture');

    // Create notifications for mentions
    if (mentions && mentions.length > 0) {
      for (const mentionedUserId of mentions) {
        await Notification.create({
          recipient: mentionedUserId,
          actor: req.userId,
          type: 'mention',
          message: `You were mentioned in a post`,
          relatedPost: post._id,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: {
        _id: post._id,
        author: post.author,
        content: post.content,
        images: post.images,
        videos: post.videos,
        visibility: post.visibility,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        createdAt: post.createdAt,
      },
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/posts/feed
 * @desc    Get user feed
 * @access  Private
 */
router.get('/feed', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.userId);
    const followingIds = user.following;
    followingIds.push(req.userId); // Include own posts

    const posts = await Post.find({
      author: { $in: followingIds },
      visibility: 'public',
    })
      .populate('author', 'firstName lastName username profilePicture')
      .populate('comments', 'content author createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({
      author: { $in: followingIds },
      visibility: 'public',
    });

    res.json({
      success: true,
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feed',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/posts/:postId
 * @desc    Get single post
 * @access  Private
 */
router.get('/:postId', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('author', 'firstName lastName username profilePicture')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'firstName lastName username profilePicture' },
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    res.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/posts/:postId/like
 * @desc    Like a post
 * @access  Private
 */
router.post('/:postId/like', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.likes.includes(req.userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already liked this post',
      });
    }

    post.likes.push(req.userId);
    await post.save();

    // Create notification
    if (post.author.toString() !== req.userId) {
      const user = await User.findById(req.userId);
      await Notification.create({
        recipient: post.author,
        actor: req.userId,
        type: 'like',
        message: `${user.firstName} ${user.lastName} liked your post`,
        relatedPost: post._id,
      });
    }

    res.json({
      success: true,
      message: 'Post liked',
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like post',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/posts/:postId/unlike
 * @desc    Unlike a post
 * @access  Private
 */
router.post('/:postId/unlike', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    post.likes = post.likes.filter(like => like.toString() !== req.userId);
    await post.save();

    res.json({
      success: true,
      message: 'Post unliked',
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlike post',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/posts/:postId/comments
 * @desc    Add comment to post
 * @access  Private
 */
router.post('/:postId/comments', authenticate, async (req, res) => {
  try {
    const { content, parentCommentId } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
      });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const comment = new Comment({
      post: req.params.postId,
      author: req.userId,
      content,
      parentComment: parentCommentId || null,
    });

    await comment.save();
    await comment.populate('author', 'firstName lastName username profilePicture');

    post.comments.push(comment._id);
    await post.save();

    // Create notification
    if (post.author.toString() !== req.userId) {
      const user = await User.findById(req.userId);
      await Notification.create({
        recipient: post.author,
        actor: req.userId,
        type: 'comment',
        message: `${user.firstName} ${user.lastName} commented on your post`,
        relatedPost: post._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added',
      comment,
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/posts/:postId
 * @desc    Delete a post
 * @access  Private
 */
router.delete('/:postId', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post',
      });
    }

    // Delete associated comments
    await Comment.deleteMany({ post: req.params.postId });

    await Post.findByIdAndDelete(req.params.postId);

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/users/:userId/posts
 * @desc    Get user posts
 * @access  Private
 */
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      author: req.params.userId,
      visibility: 'public',
    })
      .populate('author', 'firstName lastName username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({
      author: req.params.userId,
      visibility: 'public',
    });

    res.json({
      success: true,
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user posts',
      error: error.message,
    });
  }
});

export default router;
