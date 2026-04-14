import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import Notification from '../models/Notification.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

class UserService {
  // Create new user
  async createUser(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: userData.email }, { username: userData.username }],
      });

      if (existingUser) {
        throw new Error('Email or username already exists');
      }

      const user = new User(userData);
      await user.save();

      return user.toPublicProfile();
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const user = await User.findById(userId)
        .populate('followers', 'username profilePicture')
        .populate('following', 'username profilePicture')
        .populate('friends', 'username profilePicture');

      if (!user) {
        throw new Error('User not found');
      }

      return user.toPublicProfile();
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  // Get user by username
  async getUserByUsername(username) {
    try {
      const user = await User.findOne({ username })
        .populate('followers', 'username profilePicture')
        .populate('following', 'username profilePicture')
        .populate('friends', 'username profilePicture');

      if (!user) {
        throw new Error('User not found');
      }

      return user.toPublicProfile();
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  // Update user profile
  async updateUserProfile(userId, updateData) {
    try {
      const allowedFields = [
        'firstName',
        'lastName',
        'bio',
        'profilePicture',
        'coverPhoto',
        'phoneNumber',
        'dateOfBirth',
        'gender',
        'location',
        'website',
        'preferences',
      ];

      const filteredData = {};
      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });

      const user = await User.findByIdAndUpdate(userId, filteredData, {
        new: true,
        runValidators: true,
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user.toPublicProfile();
    } catch (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  }

  // Follow user
  async followUser(userId, targetUserId) {
    try {
      if (userId === targetUserId) {
        throw new Error('Cannot follow yourself');
      }

      const user = await User.findById(userId);
      const targetUser = await User.findById(targetUserId);

      if (!user || !targetUser) {
        throw new Error('User not found');
      }

      // Check if already following
      if (user.following.includes(targetUserId)) {
        throw new Error('Already following this user');
      }

      // Add to following list
      user.following.push(targetUserId);
      user.followingCount = user.following.length;

      // Add to followers list
      targetUser.followers.push(userId);
      targetUser.followersCount = targetUser.followers.length;

      await user.save();
      await targetUser.save();

      // Create notification
      await Notification.createNotification({
        recipient: targetUserId,
        actor: userId,
        type: 'follow_user',
        title: `${user.firstName} started following you`,
        message: `${user.firstName} ${user.lastName} started following you`,
        image: user.profilePicture,
        actionUrl: `/profile/${user.username}`,
      });

      return {
        success: true,
        message: 'User followed successfully',
      };
    } catch (error) {
      throw new Error(`Failed to follow user: ${error.message}`);
    }
  }

  // Unfollow user
  async unfollowUser(userId, targetUserId) {
    try {
      const user = await User.findById(userId);
      const targetUser = await User.findById(targetUserId);

      if (!user || !targetUser) {
        throw new Error('User not found');
      }

      // Remove from following list
      user.following = user.following.filter((id) => id.toString() !== targetUserId);
      user.followingCount = user.following.length;

      // Remove from followers list
      targetUser.followers = targetUser.followers.filter((id) => id.toString() !== userId);
      targetUser.followersCount = targetUser.followers.length;

      await user.save();
      await targetUser.save();

      return {
        success: true,
        message: 'User unfollowed successfully',
      };
    } catch (error) {
      throw new Error(`Failed to unfollow user: ${error.message}`);
    }
  }

  // Send friend request
  async sendFriendRequest(senderId, receiverId) {
    try {
      if (senderId === receiverId) {
        throw new Error('Cannot send friend request to yourself');
      }

      // Check if users exist
      const sender = await User.findById(senderId);
      const receiver = await User.findById(receiverId);

      if (!sender || !receiver) {
        throw new Error('User not found');
      }

      // Check if already friends
      if (sender.friends.includes(receiverId)) {
        throw new Error('Already friends with this user');
      }

      // Check for existing request
      const existingRequest = await FriendRequest.findOne({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId },
        ],
        status: { $in: ['pending', 'accepted'] },
      });

      if (existingRequest) {
        throw new Error('Friend request already exists');
      }

      const friendRequest = new FriendRequest({
        sender: senderId,
        receiver: receiverId,
      });

      await friendRequest.save();

      // Create notification
      await Notification.createNotification({
        recipient: receiverId,
        actor: senderId,
        type: 'friend_request',
        title: `${sender.firstName} sent you a friend request`,
        message: `${sender.firstName} ${sender.lastName} sent you a friend request`,
        image: sender.profilePicture,
        actionUrl: `/profile/${sender.username}`,
      });

      return {
        success: true,
        message: 'Friend request sent successfully',
        requestId: friendRequest._id,
      };
    } catch (error) {
      throw new Error(`Failed to send friend request: ${error.message}`);
    }
  }

  // Accept friend request
  async acceptFriendRequest(requestId) {
    try {
      const friendRequest = await FriendRequest.findById(requestId);

      if (!friendRequest) {
        throw new Error('Friend request not found');
      }

      if (friendRequest.status !== 'pending') {
        throw new Error('Friend request is not pending');
      }

      const sender = await User.findById(friendRequest.sender);
      const receiver = await User.findById(friendRequest.receiver);

      if (!sender || !receiver) {
        throw new Error('User not found');
      }

      // Add to friends list
      sender.friends.push(friendRequest.receiver);
      sender.friendsCount = sender.friends.length;

      receiver.friends.push(friendRequest.sender);
      receiver.friendsCount = receiver.friends.length;

      // Update friend request status
      friendRequest.status = 'accepted';
      friendRequest.respondedAt = new Date();

      await sender.save();
      await receiver.save();
      await friendRequest.save();

      // Create notification
      await Notification.createNotification({
        recipient: friendRequest.sender,
        actor: friendRequest.receiver,
        type: 'friend_accepted',
        title: `${receiver.firstName} accepted your friend request`,
        message: `${receiver.firstName} ${receiver.lastName} accepted your friend request`,
        image: receiver.profilePicture,
        actionUrl: `/profile/${receiver.username}`,
      });

      return {
        success: true,
        message: 'Friend request accepted',
      };
    } catch (error) {
      throw new Error(`Failed to accept friend request: ${error.message}`);
    }
  }

  // Decline friend request
  async declineFriendRequest(requestId) {
    try {
      const friendRequest = await FriendRequest.findById(requestId);

      if (!friendRequest) {
        throw new Error('Friend request not found');
      }

      if (friendRequest.status !== 'pending') {
        throw new Error('Friend request is not pending');
      }

      friendRequest.status = 'declined';
      friendRequest.respondedAt = new Date();

      await friendRequest.save();

      return {
        success: true,
        message: 'Friend request declined',
      };
    } catch (error) {
      throw new Error(`Failed to decline friend request: ${error.message}`);
    }
  }

  // Get friend requests
  async getFriendRequests(userId, status = 'pending') {
    try {
      const requests = await FriendRequest.find({
        receiver: userId,
        status,
      })
        .populate('sender', 'username firstName lastName profilePicture')
        .sort({ createdAt: -1 });

      return requests;
    } catch (error) {
      throw new Error(`Failed to get friend requests: ${error.message}`);
    }
  }

  // Search users
  async searchUsers(query, limit = 20) {
    try {
      const users = await User.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .select('username firstName lastName profilePicture bio');

      return users;
    } catch (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }
  }

  // Get user statistics
  async getUserStatistics(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      return {
        postsCount: user.postsCount,
        videosCount: user.videosCount,
        storiesCount: user.storiesCount,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        friendsCount: user.friendsCount,
      };
    } catch (error) {
      throw new Error(`Failed to get user statistics: ${error.message}`);
    }
  }

  // Block user
  async blockUser(userId, targetUserId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (user.blockedUsers.includes(targetUserId)) {
        throw new Error('User already blocked');
      }

      user.blockedUsers.push(targetUserId);
      await user.save();

      return {
        success: true,
        message: 'User blocked successfully',
      };
    } catch (error) {
      throw new Error(`Failed to block user: ${error.message}`);
    }
  }

  // Unblock user
  async unblockUser(userId, targetUserId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      user.blockedUsers = user.blockedUsers.filter((id) => id.toString() !== targetUserId);
      await user.save();

      return {
        success: true,
        message: 'User unblocked successfully',
      };
    } catch (error) {
      throw new Error(`Failed to unblock user: ${error.message}`);
    }
  }
}

export default new UserService();
