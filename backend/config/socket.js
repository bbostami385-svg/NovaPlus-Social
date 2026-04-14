import { Server } from 'socket.io';
import User from '../models/User.js';
import MessageService from '../services/MessageService.js';

// Store active connections
const activeConnections = new Map();

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Middleware to verify token
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    const userId = socket.handshake.auth.userId;

    if (!userId) {
      return next(new Error('Authentication error'));
    }

    socket.userId = userId;
    next();
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId} (Socket ID: ${socket.id})`);

    // Store connection
    activeConnections.set(socket.userId, socket.id);

    // Update user online status
    User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date(),
    }).catch((err) => console.error('Error updating user status:', err));

    // Broadcast user online
    io.emit('user_online', {
      userId: socket.userId,
      timestamp: new Date(),
    });

    // ==================== MESSAGING ====================

    // Join conversation room
    socket.on('join_conversation', (data) => {
      const { otherUserId } = data;
      const roomId = [socket.userId, otherUserId].sort().join('_');
      socket.join(roomId);
      console.log(`User ${socket.userId} joined conversation room: ${roomId}`);
    });

    // Leave conversation room
    socket.on('leave_conversation', (data) => {
      const { otherUserId } = data;
      const roomId = [socket.userId, otherUserId].sort().join('_');
      socket.leave(roomId);
      console.log(`User ${socket.userId} left conversation room: ${roomId}`);
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content, media, messageType } = data;

        const message = await MessageService.sendMessage(socket.userId, receiverId, {
          content,
          media,
          messageType,
        });

        const roomId = [socket.userId, receiverId].sort().join('_');

        // Emit to both users
        io.to(roomId).emit('receive_message', {
          _id: message._id,
          sender: socket.userId,
          receiver: receiverId,
          content: message.content,
          media: message.media,
          messageType: message.messageType,
          status: message.status,
          sentAt: message.sentAt,
          createdAt: message.createdAt,
        });

        // Mark as delivered
        await MessageService.markAsDelivered(message._id);
        io.to(roomId).emit('message_delivered', { messageId: message._id });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { receiverId } = data;
      const roomId = [socket.userId, receiverId].sort().join('_');
      socket.to(roomId).emit('user_typing', {
        userId: socket.userId,
      });
    });

    // Stop typing
    socket.on('stop_typing', (data) => {
      const { receiverId } = data;
      const roomId = [socket.userId, receiverId].sort().join('_');
      socket.to(roomId).emit('user_stop_typing', {
        userId: socket.userId,
      });
    });

    // ==================== GROUP MESSAGING ====================

    // Join group
    socket.on('join_group', (data) => {
      const { groupId } = data;
      const roomId = `group_${groupId}`;
      socket.join(roomId);
      console.log(`User ${socket.userId} joined group: ${groupId}`);

      io.to(roomId).emit('user_joined_group', {
        userId: socket.userId,
        groupId,
        timestamp: new Date(),
      });
    });

    // Leave group
    socket.on('leave_group', (data) => {
      const { groupId } = data;
      const roomId = `group_${groupId}`;
      socket.leave(roomId);
      console.log(`User ${socket.userId} left group: ${groupId}`);

      io.to(roomId).emit('user_left_group', {
        userId: socket.userId,
        groupId,
        timestamp: new Date(),
      });
    });

    // Send group message
    socket.on('send_group_message', async (data) => {
      try {
        const { groupId, content, media, messageType } = data;

        const message = await MessageService.sendGroupMessage(socket.userId, groupId, {
          content,
          media,
          messageType,
        });

        const roomId = `group_${groupId}`;

        io.to(roomId).emit('receive_group_message', {
          _id: message._id,
          sender: socket.userId,
          group: groupId,
          content: message.content,
          media: message.media,
          messageType: message.messageType,
          status: message.status,
          sentAt: message.sentAt,
          createdAt: message.createdAt,
        });

        await MessageService.markAsDelivered(message._id);
        io.to(roomId).emit('message_delivered', { messageId: message._id });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // ==================== NOTIFICATIONS ====================

    // Send notification
    socket.on('send_notification', (data) => {
      const { recipientId, notification } = data;
      const recipientSocketId = activeConnections.get(recipientId);

      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receive_notification', notification);
      }
    });

    // ==================== PRESENCE ====================

    // Get online users
    socket.on('get_online_users', () => {
      const onlineUsers = Array.from(activeConnections.keys());
      socket.emit('online_users', onlineUsers);
    });

    // ==================== DISCONNECT ====================

    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.userId}`);

      // Remove connection
      activeConnections.delete(socket.userId);

      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
      }).catch((err) => console.error('Error updating user status:', err));

      // Broadcast user offline
      io.emit('user_offline', {
        userId: socket.userId,
        timestamp: new Date(),
      });
    });

    // ==================== ERROR HANDLING ====================

    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  return io;
};

// Helper function to get socket ID for user
export const getSocketIdForUser = (userId) => {
  return activeConnections.get(userId);
};

// Helper function to get all active connections
export const getActiveConnections = () => {
  return Array.from(activeConnections.entries());
};

export default initializeSocket;
