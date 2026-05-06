import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Notification Service
 * Handles real-time notifications with WebSocket and database storage
 */

let io; // Socket.io instance

/**
 * Initialize Socket.io
 * @param {object} socketInstance - Socket.io instance
 */
export const initializeSocketIO = (socketInstance) => {
  io = socketInstance;
  console.log('Socket.io initialized for notifications');
};

/**
 * Send real-time notification
 * @param {string} userId - Recipient user ID
 * @param {object} notificationData - Notification data
 * @returns {Promise<void>}
 */
export const sendRealtimeNotification = async (userId, notificationData) => {
  try {
    if (!io) {
      console.warn('Socket.io not initialized');
      return;
    }

    // Emit to specific user
    io.to(`user:${userId}`).emit('notification', notificationData);
    console.log(`Real-time notification sent to user ${userId}`);
  } catch (error) {
    console.error(`Failed to send real-time notification: ${error.message}`);
    throw error;
  }
};

/**
 * Broadcast notification to multiple users
 * @param {array} userIds - Array of user IDs
 * @param {object} notificationData - Notification data
 * @returns {Promise<void>}
 */
export const broadcastNotification = async (userIds, notificationData) => {
  try {
    if (!io) {
      console.warn('Socket.io not initialized');
      return;
    }

    userIds.forEach(userId => {
      io.to(`user:${userId}`).emit('notification', notificationData);
    });

    console.log(`Broadcast notification sent to ${userIds.length} users`);
  } catch (error) {
    console.error(`Failed to broadcast notification: ${error.message}`);
    throw error;
  }
};

/**
 * Create and store notification in database
 * @param {string} userId - Recipient user ID
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} data - Additional data
 * @returns {Promise<object>} - Created notification
 */
export const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    const notification = new Notification({
      recipient: userId,
      type,
      title,
      message,
      data,
      isRead: false,
      createdAt: new Date(),
    });

    await notification.save();
    console.log(`Notification created for user ${userId}`);

    return notification;
  } catch (error) {
    console.error(`Failed to create notification: ${error.message}`);
    throw error;
  }
};

/**
 * Create and send notification (database + real-time)
 * @param {string} userId - Recipient user ID
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} data - Additional data
 * @returns {Promise<object>} - Created notification
 */
export const createAndSendNotification = async (userId, type, title, message, data = {}) => {
  try {
    // Store in database
    const notification = await createNotification(userId, type, title, message, data);

    // Send real-time notification
    await sendRealtimeNotification(userId, {
      id: notification._id,
      type,
      title,
      message,
      data,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (error) {
    console.error(`Failed to create and send notification: ${error.message}`);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<object>} - Updated notification
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    console.log(`Notification marked as read: ${notificationId}`);
    return notification;
  } catch (error) {
    console.error(`Failed to mark notification as read: ${error.message}`);
    throw error;
  }
};

/**
 * Mark all notifications as read for user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    console.log(`All notifications marked as read for user ${userId}`);
  } catch (error) {
    console.error(`Failed to mark all notifications as read: ${error.message}`);
    throw error;
  }
};

/**
 * Get user notifications
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @returns {Promise<array>} - Notifications
 */
export const getUserNotifications = async (userId, options = {}) => {
  try {
    const {
      limit = 20,
      skip = 0,
      isRead = null,
      type = null,
    } = options;

    let query = { recipient: userId };

    if (isRead !== null) {
      query.isRead = isRead;
    }

    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return notifications;
  } catch (error) {
    console.error(`Failed to get user notifications: ${error.message}`);
    throw error;
  }
};

/**
 * Get unread notification count
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Unread count
 */
export const getUnreadNotificationCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return count;
  } catch (error) {
    console.error(`Failed to get unread notification count: ${error.message}`);
    return 0;
  }
};

/**
 * Delete notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<void>}
 */
export const deleteNotification = async (notificationId) => {
  try {
    await Notification.findByIdAndDelete(notificationId);
    console.log(`Notification deleted: ${notificationId}`);
  } catch (error) {
    console.error(`Failed to delete notification: ${error.message}`);
    throw error;
  }
};

/**
 * Delete all notifications for user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const deleteAllNotifications = async (userId) => {
  try {
    await Notification.deleteMany({ recipient: userId });
    console.log(`All notifications deleted for user ${userId}`);
  } catch (error) {
    console.error(`Failed to delete all notifications: ${error.message}`);
    throw error;
  }
};

/**
 * Send notification to followers
 * @param {string} userId - User ID
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} data - Additional data
 * @returns {Promise<void>}
 */
export const notifyFollowers = async (userId, type, title, message, data = {}) => {
  try {
    const user = await User.findById(userId).select('followers');

    if (!user || !user.followers || user.followers.length === 0) {
      return;
    }

    // Create notifications for all followers
    const notifications = user.followers.map(followerId => ({
      recipient: followerId,
      type,
      title,
      message,
      data,
      isRead: false,
      createdAt: new Date(),
    }));

    await Notification.insertMany(notifications);

    // Send real-time notifications
    await broadcastNotification(user.followers, {
      type,
      title,
      message,
      data,
    });

    console.log(`Notification sent to ${user.followers.length} followers`);
  } catch (error) {
    console.error(`Failed to notify followers: ${error.message}`);
    throw error;
  }
};

export default {
  initializeSocketIO,
  sendRealtimeNotification,
  broadcastNotification,
  createNotification,
  createAndSendNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUserNotifications,
  getUnreadNotificationCount,
  deleteNotification,
  deleteAllNotifications,
  notifyFollowers,
};
