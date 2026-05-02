import Message from '../models/Message.js';
import User from '../models/User.js';

class MessageService {
  // Create a new message
  async createMessage(senderId, receiverId, content) {
    try {
      const message = new Message({
        sender: senderId,
        receiver: receiverId,
        content,
        status: 'sent',
      });

      await message.save();
      return message;
    } catch (error) {
      throw new Error(`Failed to create message: ${error.message}`);
    }
  }

  // Get conversation between two users
  async getConversation(userId1, userId2, limit = 50, skip = 0) {
    try {
      const messages = await Message.find({
        $or: [
          { sender: userId1, receiver: userId2 },
          { sender: userId2, receiver: userId1 },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('sender', 'username profilePicture')
        .populate('receiver', 'username profilePicture');

      return messages.reverse();
    } catch (error) {
      throw new Error(`Failed to get conversation: ${error.message}`);
    }
  }

  // Mark message as read
  async markAsRead(messageId) {
    try {
      return await Message.findByIdAndUpdate(
        messageId,
        { status: 'read', readAt: new Date() },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Failed to mark message as read: ${error.message}`);
    }
  }

  // Get user conversations
  async getUserConversations(userId) {
    try {
      const conversations = await Message.aggregate([
        {
          $match: {
            $or: [{ sender: userId }, { receiver: userId }],
          },
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$sender', userId] },
                '$receiver',
                '$sender',
              ],
            },
            lastMessage: { $last: '$content' },
            lastMessageTime: { $last: '$createdAt' },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$sender', userId] },
                      { $eq: ['$status', 'sent'] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { lastMessageTime: -1 } },
      ]);

      // Populate user details
      const populatedConversations = await Promise.all(
        conversations.map(async (conv) => {
          const user = await User.findById(conv._id).select(
            'username profilePicture'
          );
          return {
            userId: conv._id,
            username: user?.username,
            profilePicture: user?.profilePicture,
            lastMessage: conv.lastMessage,
            lastMessageTime: conv.lastMessageTime,
            unreadCount: conv.unreadCount,
          };
        })
      );

      return populatedConversations;
    } catch (error) {
      throw new Error(`Failed to get conversations: ${error.message}`);
    }
  }

  // Delete message
  async deleteMessage(messageId, userId) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      if (message.sender.toString() !== userId) {
        throw new Error('Unauthorized to delete this message');
      }

      await Message.findByIdAndDelete(messageId);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }

  // Search messages
  async searchMessages(userId, query) {
    try {
      return await Message.find({
        $or: [
          { sender: userId, content: { $regex: query, $options: 'i' } },
          { receiver: userId, content: { $regex: query, $options: 'i' } },
        ],
      })
        .sort({ createdAt: -1 })
        .populate('sender', 'username profilePicture')
        .populate('receiver', 'username profilePicture');
    } catch (error) {
      throw new Error(`Failed to search messages: ${error.message}`);
    }
  }
}

export default new MessageService();
