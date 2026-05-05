import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

const router = express.Router();

/**
 * @route   GET /api/chat/conversations
 * @desc    Get all chat conversations for user
 * @access  Private
 */
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const conversations = await Chat.find({
      participants: req.userId,
    })
      .populate('participants', 'firstName lastName profilePicture')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/chat/create
 * @desc    Create or get existing chat
 * @access  Private
 */
router.post('/create', authenticate, async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required',
      });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.userId, recipientId] },
    });

    if (!chat) {
      chat = new Chat({
        participants: [req.userId, recipientId],
        type: 'direct',
      });
      await chat.save();
    }

    res.status(201).json({
      success: true,
      chat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create chat',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/chat/:chatId/messages
 * @desc    Get messages in a chat
 * @access  Private
 */
router.get('/:chatId/messages', authenticate, async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .populate('sender', 'firstName lastName profilePicture')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/chat/:chatId/message
 * @desc    Send a message
 * @access  Private
 */
router.post('/:chatId/message', authenticate, async (req, res) => {
  try {
    const { content, type = 'text', mediaUrl } = req.body;

    if (!content && !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    const message = new Message({
      chatId: req.params.chatId,
      sender: req.userId,
      content,
      type,
      mediaUrl,
    });

    await message.save();

    // Update chat's last message
    await Chat.findByIdAndUpdate(req.params.chatId, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/chat/:messageId
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/:messageId', authenticate, async (req, res) => {
  try {
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
        message: 'Unauthorized to delete this message',
      });
    }

    await Message.findByIdAndDelete(req.params.messageId);

    res.json({
      success: true,
      message: 'Message deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message,
    });
  }
});

export default router;
