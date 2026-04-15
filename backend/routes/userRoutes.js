import express from 'express';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import Notification from '../models/Notification.js';

const router = express.Router();

/**
 * @route   GET /api/users/:userId
 * @desc    Get user profile
 * @access  Private
 */
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture')
      .populate('friends', 'username profilePicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isFollowing = user.followers.some(f => f._id.toString() === req.userId);
    const isFriend = user.friends.some(f => f._id.toString() === req.userId);

    res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        bio: user.bio,
        profilePicture: user.profilePicture,
        coverPhoto: user.coverPhoto,
        location: user.location,
        website: user.website,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        friendsCount: user.friends.length,
        postsCount: user.postsCount,
        videosCount: user.videosCount,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        isFollowing,
        isFriend,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/users/profile/update
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile/update', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, bio, profilePicture, coverPhoto, location, website } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          bio: bio || undefined,
          profilePicture: profilePicture || undefined,
          coverPhoto: coverPhoto || undefined,
          location: location || undefined,
          website: website || undefined,
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        bio: user.bio,
        profilePicture: user.profilePicture,
        coverPhoto: user.coverPhoto,
        location: user.location,
        website: user.website,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/users/:userId/follow
 * @desc    Follow a user
 * @access  Private
 */
router.post('/:userId/follow', authenticate, async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    if (targetUserId === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself',
      });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(req.userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if already following
    if (targetUser.followers.includes(req.userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user',
      });
    }

    // Add follower
    targetUser.followers.push(req.userId);
    currentUser.following.push(targetUserId);

    await targetUser.save();
    await currentUser.save();

    // Create notification
    await Notification.create({
      recipient: targetUserId,
      actor: req.userId,
      type: 'follow',
      message: `${currentUser.firstName} ${currentUser.lastName} started following you`,
    });

    res.json({
      success: true,
      message: 'User followed successfully',
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to follow user',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/users/:userId/unfollow
 * @desc    Unfollow a user
 * @access  Private
 */
router.post('/:userId/unfollow', authenticate, async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(req.userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Remove follower
    targetUser.followers = targetUser.followers.filter(f => f.toString() !== req.userId);
    currentUser.following = currentUser.following.filter(f => f.toString() !== targetUserId);

    await targetUser.save();
    await currentUser.save();

    res.json({
      success: true,
      message: 'User unfollowed successfully',
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unfollow user',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/users/:userId/friend-request
 * @desc    Send friend request
 * @access  Private
 */
router.post('/:userId/friend-request', authenticate, async (req, res) => {
  try {
    const receiverId = req.params.userId;

    if (receiverId === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself',
      });
    }

    // Check if already friends
    const currentUser = await User.findById(req.userId);
    if (currentUser.friends.includes(receiverId)) {
      return res.status(400).json({
        success: false,
        message: 'Already friends with this user',
      });
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      sender: req.userId,
      receiver: receiverId,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already sent',
      });
    }

    // Create friend request
    const friendRequest = new FriendRequest({
      sender: req.userId,
      receiver: receiverId,
      status: 'pending',
    });

    await friendRequest.save();

    // Create notification
    const sender = await User.findById(req.userId);
    await Notification.create({
      recipient: receiverId,
      actor: req.userId,
      type: 'friend_request',
      message: `${sender.firstName} ${sender.lastName} sent you a friend request`,
      relatedRequest: friendRequest._id,
    });

    res.status(201).json({
      success: true,
      message: 'Friend request sent',
      requestId: friendRequest._id,
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send friend request',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/users/friend-requests/:requestId/accept
 * @desc    Accept friend request
 * @access  Private
 */
router.post('/friend-requests/:requestId/accept', authenticate, async (req, res) => {
  try {
    const friendRequest = await FriendRequest.findById(req.params.requestId);

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found',
      });
    }

    if (friendRequest.receiver.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this request',
      });
    }

    // Add friends
    const sender = await User.findById(friendRequest.sender);
    const receiver = await User.findById(friendRequest.receiver);

    sender.friends.push(friendRequest.receiver);
    receiver.friends.push(friendRequest.sender);

    friendRequest.status = 'accepted';

    await sender.save();
    await receiver.save();
    await friendRequest.save();

    // Create notification
    await Notification.create({
      recipient: friendRequest.sender,
      actor: req.userId,
      type: 'friend_request_accepted',
      message: `${receiver.firstName} ${receiver.lastName} accepted your friend request`,
    });

    res.json({
      success: true,
      message: 'Friend request accepted',
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept friend request',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/users/friend-requests/:requestId/decline
 * @desc    Decline friend request
 * @access  Private
 */
router.post('/friend-requests/:requestId/decline', authenticate, async (req, res) => {
  try {
    const friendRequest = await FriendRequest.findById(req.params.requestId);

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found',
      });
    }

    if (friendRequest.receiver.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to decline this request',
      });
    }

    friendRequest.status = 'declined';
    await friendRequest.save();

    res.json({
      success: true,
      message: 'Friend request declined',
    });
  } catch (error) {
    console.error('Decline friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline friend request',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Private
 */
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    })
      .limit(parseInt(limit))
      .select('_id username firstName lastName profilePicture');

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: error.message,
    });
  }
});

export default router;
