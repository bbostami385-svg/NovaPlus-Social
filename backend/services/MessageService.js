import Message from '../models/Message.js';
import Group from '../models/Group.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

class MessageService {
  // Send message (1-to-1)
  async sendMessage(senderId, receiverId, messageData) {
    try {
      // Check if users exist
      const sender = await User.findById(senderId);
      const receiver = await User.findById(receiverId);

      if (!sender || !receiver) {
        throw new Error('User not found');
      }

      // Check if blocked
      if (receiver.blockedUsers.includes(senderId)) {
        throw new Error('You are blocked by this user');
      }

      const message = new Message({
        sender: senderId,
        receiver: receiverId,
        content: messageData.content,
        media: messageData.media || [],
        messageType: messageData.messageType || 'text',
        status: 'sent',
        sentAt: new Date(),
      });

      await message.save();

      // Create notification
      await Notification.createNotification({
        recipient: receiverId,
        actor: senderId,
        type: 'message',
        title: `New message from ${sender.firstName}`,
        message: messageData.content?.substring(0, 100) || 'Sent a message',
        image: sender.profilePicture,
        relatedMessage: message._id,
        channels: {
          inApp: true,
          push: true,
        },
        actionUrl: `/messages/${senderId}`,
      });

      return message;
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  // Send group message
  async sendGroupMessage(senderId, groupId, messageData) {
    try {
      const group = await Group.findById(groupId);

      if (!group) {
        throw new Error('Group not found');
      }

      // Check if user is member
      const isMember = group.members.find((m) => m.userId.toString() === senderId);

      if (!isMember) {
        throw new Error('You are not a member of this group');
      }

      const sender = await User.findById(senderId);

      const message = new Message({
        sender: senderId,
        group: groupId,
        content: messageData.content,
        media: messageData.media || [],
        messageType: messageData.messageType || 'text',
        status: 'sent',
        sentAt: new Date(),
      });

      await message.save();

      // Update group last message
      group.lastMessage = message._id;
      group.lastMessageAt = new Date();
      group.messagesCount += 1;

      await group.save();

      // Create notifications for all group members except sender
      const groupMembers = group.members
        .filter((m) => m.userId.toString() !== senderId)
        .map((m) => m.userId);

      for (const memberId of groupMembers) {
        await Notification.createNotification({
          recipient: memberId,
          actor: senderId,
          type: 'group_message',
          title: `${sender.firstName} in ${group.name}`,
          message: messageData.content?.substring(0, 100) || 'Sent a message',
          image: sender.profilePicture,
          relatedMessage: message._id,
          relatedGroup: groupId,
          channels: {
            inApp: true,
            push: true,
          },
          actionUrl: `/groups/${groupId}`,
        });
      }

      return message;
    } catch (error) {
      throw new Error(`Failed to send group message: ${error.message}`);
    }
  }

  // Get conversation
  async getConversation(userId, otherUserId, page = 1, limit = 50) {
    try {
      const skip = (page - 1) * limit;

      const messages = await Message.find({
        $or: [
          { sender: userId, receiver: otherUserId },
          { sender: otherUserId, receiver: userId },
        ],
      })
        .populate('sender', 'username firstName lastName profilePicture')
        .populate('receiver', 'username firstName lastName profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Message.countDocuments({
        $or: [
          { sender: userId, receiver: otherUserId },
          { sender: otherUserId, receiver: userId },
        ],
      });

      // Mark messages as read
      await Message.updateMany(
        {
          receiver: userId,
          sender: otherUserId,
          status: { $ne: 'read' },
        },
        {
          status: 'read',
          readAt: new Date(),
        }
      );

      return {
        messages: messages.reverse(),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to get conversation: ${error.message}`);
    }
  }

  // Get group messages
  async getGroupMessages(groupId, page = 1, limit = 50) {
    try {
      const skip = (page - 1) * limit;

      const messages = await Message.find({ group: groupId })
        .populate('sender', 'username firstName lastName profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Message.countDocuments({ group: groupId });

      return {
        messages: messages.reverse(),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to get group messages: ${error.message}`);
    }
  }

  // Mark message as delivered
  async markAsDelivered(messageId) {
    try {
      const message = await Message.findById(messageId);

      if (!message) {
        throw new Error('Message not found');
      }

      message.status = 'delivered';
      message.deliveredAt = new Date();

      await message.save();

      return message;
    } catch (error) {
      throw new Error(`Failed to mark message as delivered: ${error.message}`);
    }
  }

  // Mark message as read
  async markAsRead(messageId) {
    try {
      const message = await Message.findById(messageId);

      if (!message) {
        throw new Error('Message not found');
      }

      message.status = 'read';
      message.readAt = new Date();

      await message.save();

      return message;
    } catch (error) {
      throw new Error(`Failed to mark message as read: ${error.message}`);
    }
  }

  // Delete message
  async deleteMessage(messageId, userId, deleteForEveryone = false) {
    try {
      const message = await Message.findById(messageId);

      if (!message) {
        throw new Error('Message not found');
      }

      if (message.sender.toString() !== userId) {
        throw new Error('Not authorized to delete this message');
      }

      if (deleteForEveryone) {
        message.isDeletedForEveryone = true;
      }

      message.isDeleted = true;
      message.deletedAt = new Date();

      await message.save();

      return {
        success: true,
        message: 'Message deleted successfully',
      };
    } catch (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }

  // Edit message
  async editMessage(messageId, userId, newContent) {
    try {
      const message = await Message.findById(messageId);

      if (!message) {
        throw new Error('Message not found');
      }

      if (message.sender.toString() !== userId) {
        throw new Error('Not authorized to edit this message');
      }

      // Save edit history
      message.editHistory.push({
        content: message.content,
        editedAt: new Date(),
      });

      message.content = newContent;
      message.isEdited = true;
      message.editedAt = new Date();

      await message.save();

      return message;
    } catch (error) {
      throw new Error(`Failed to edit message: ${error.message}`);
    }
  }

  // Add reaction to message
  async addReaction(messageId, userId, emoji) {
    try {
      const message = await Message.findById(messageId);

      if (!message) {
        throw new Error('Message not found');
      }

      // Check if user already reacted with same emoji
      const existingReaction = message.reactions.find(
        (r) => r.userId.toString() === userId && r.emoji === emoji
      );

      if (existingReaction) {
        throw new Error('Already reacted with this emoji');
      }

      message.reactions.push({
        userId,
        emoji,
      });

      await message.save();

      return message;
    } catch (error) {
      throw new Error(`Failed to add reaction: ${error.message}`);
    }
  }

  // Remove reaction from message
  async removeReaction(messageId, userId, emoji) {
    try {
      const message = await Message.findById(messageId);

      if (!message) {
        throw new Error('Message not found');
      }

      message.reactions = message.reactions.filter(
        (r) => !(r.userId.toString() === userId && r.emoji === emoji)
      );

      await message.save();

      return message;
    } catch (error) {
      throw new Error(`Failed to remove reaction: ${error.message}`);
    }
  }

  // Get conversations list
  async getConversationsList(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      // Get unique conversation partners
      const messages = await Message.find({
        $or: [{ sender: userId }, { receiver: userId }],
      })
        .sort({ createdAt: -1 })
        .select('sender receiver');

      const conversationMap = new Map();

      messages.forEach((msg) => {
        const otherUserId = msg.sender.toString() === userId ? msg.receiver : msg.sender;
        if (!conversationMap.has(otherUserId.toString())) {
          conversationMap.set(otherUserId.toString(), otherUserId);
        }
      });

      const conversationIds = Array.from(conversationMap.values());

      const conversations = await User.find({
        _id: { $in: conversationIds },
      })
        .select('username firstName lastName profilePicture isOnline lastSeen')
        .skip(skip)
        .limit(limit);

      return {
        conversations,
        pagination: {
          page,
          limit,
          total: conversationIds.length,
          pages: Math.ceil(conversationIds.length / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to get conversations list: ${error.message}`);
    }
  }
}

export default new MessageService();
