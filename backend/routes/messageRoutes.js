import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const router = express.Router();

/**
 * @route   POST /api/messages/send
 * @desc    Send a message
 * @access  Private
 */
router.post('/send', authenticate, async (req, res) => {
  try {
    const { receiverId, groupId, content, media } = req.body;

    if (!content && (!media || media.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Message content or media is required',
      });
    }

    if (!receiverId && !groupId) {
      return res.status(400).json({
        success: false,
        message: 'Receiver or group is required',
      });
    }

    const message = new Message({
      sender: req.userId,
      receiver: receiverId || null,
      group: groupId || null,
      content,
      media: media || [],
      status: 'sent',
    });

    await message.save();
    await message.populate('sender', 'firstName lastName username profilePicture');

    // Create notification for direct message
    if (receiverId && receiverId !== req.userId) {
      const sender = await User.findById(req.userId);
      await Notification.create({
        recipient: receiverId,
        actor: req.userId,
        type: 'message',
        message: `${sender.firstName} ${sender.lastName} sent you a message`,
        relatedMessage: message._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: {
        _id: message._id,
        sender: message.sender,
        receiver: message.receiver,
        content: message.content,
        media: message.media,
        status: message.status,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/messages/conversation/:userId
 * @desc    Get conversation with a user
 * @access  Private
 */
router.get('/conversation/:userId', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.userId },
      ],
    })
      .populate('sender', 'firstName lastName username profilePicture')
      .populate('receiver', 'firstName lastName username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({
      $or: [
        { sender: req.userId, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.userId },
      ],
    });

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/messages/group/:groupId
 * @desc    Get group messages
 * @access  Private
 */
router.get('/group/:groupId', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ group: req.params.groupId })
      .populate('sender', 'firstName lastName username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ group: req.params.groupId });

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group messages',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/messages/:messageId/read
 * @desc    Mark message as read
 * @access  Private
 */
router.post('/:messageId/read', authenticate, async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      {
        $set: {
          status: 'read',
          readAt: new Date(),
        },
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    res.json({
      success: true,
      message: 'Message marked as read',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/:messageId', authenticate, async (req, res) => {
  try {
    const { deleteForEveryone = false } = req.body;

    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    if (message.sender.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message',
      });
    }

    if (deleteForEveryone) {
      await Message.findByIdAndDelete(req.params.messageId);
    } else {
      message.deletedForMe = true;
      await message.save();
    }

    res.json({
      success: true,
      message: 'Message deleted',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/messages/conversations
 * @desc    Get all conversations
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: req.userId }, { receiver: req.userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.userId] },
              '$receiver',
              '$sender',
            ],
          },
          lastMessage: { $first: '$content' },
          lastMessageTime: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$sender', req.userId] },
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
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $sort: { lastMessageTime: -1 },
      },
    ]);

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message,
    });
  }
});

export default router;
