import express from 'express';
import { authenticate } from '../middleware/auth.js';
import LiveStream from '../models/LiveStream.js';

const router = express.Router();

/**
 * @route   POST /api/live/start
 * @desc    Start a live stream
 * @access  Private
 */
router.post('/start', authenticate, async (req, res) => {
  try {
    const { title, description = '', thumbnail = '', category = 'general' } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Stream title is required',
      });
    }

    const liveStream = new LiveStream({
      streamer: req.userId,
      title,
      description,
      thumbnail,
      category,
      status: 'live',
      startedAt: new Date(),
    });

    await liveStream.save();
    await liveStream.populate('streamer', 'firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      liveStream,
      streamKey: liveStream._id, // Use stream ID as key for RTMP
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start live stream',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/live/active
 * @desc    Get all active live streams
 * @access  Public
 */
router.get('/active', async (req, res) => {
  try {
    const liveStreams = await LiveStream.find({ status: 'live' })
      .populate('streamer', 'firstName lastName profilePicture')
      .sort({ startedAt: -1 });

    res.json({
      success: true,
      liveStreams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live streams',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/live/:streamId
 * @desc    Get live stream details
 * @access  Public
 */
router.get('/:streamId', async (req, res) => {
  try {
    const liveStream = await LiveStream.findById(req.params.streamId)
      .populate('streamer', 'firstName lastName profilePicture')
      .populate('viewers', 'firstName lastName profilePicture');

    if (!liveStream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found',
      });
    }

    res.json({
      success: true,
      liveStream,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live stream',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/live/:streamId/join
 * @desc    Join a live stream
 * @access  Private
 */
router.post('/:streamId/join', authenticate, async (req, res) => {
  try {
    const liveStream = await LiveStream.findById(req.params.streamId);

    if (!liveStream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found',
      });
    }

    if (!liveStream.viewers.includes(req.userId)) {
      liveStream.viewers.push(req.userId);
      liveStream.viewerCount = liveStream.viewers.length;
      await liveStream.save();
    }

    res.json({
      success: true,
      viewerCount: liveStream.viewerCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to join live stream',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/live/:streamId/leave
 * @desc    Leave a live stream
 * @access  Private
 */
router.post('/:streamId/leave', authenticate, async (req, res) => {
  try {
    const liveStream = await LiveStream.findById(req.params.streamId);

    if (!liveStream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found',
      });
    }

    liveStream.viewers = liveStream.viewers.filter(id => id.toString() !== req.userId);
    liveStream.viewerCount = liveStream.viewers.length;
    await liveStream.save();

    res.json({
      success: true,
      viewerCount: liveStream.viewerCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to leave live stream',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/live/:streamId/end
 * @desc    End a live stream
 * @access  Private
 */
router.post('/:streamId/end', authenticate, async (req, res) => {
  try {
    const liveStream = await LiveStream.findById(req.params.streamId);

    if (!liveStream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found',
      });
    }

    if (liveStream.streamer.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to end this stream',
      });
    }

    liveStream.status = 'ended';
    liveStream.endedAt = new Date();
    await liveStream.save();

    res.json({
      success: true,
      message: 'Live stream ended',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to end live stream',
      error: error.message,
    });
  }
});

export default router;
