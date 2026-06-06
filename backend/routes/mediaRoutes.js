import express from 'express';
import multer from 'multer';
import MediaStorageService from '../services/MediaStorageService.js';
import SecurityService from '../services/SecurityService.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB for videos
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

/**
 * POST /api/media/upload-video
 * Upload video with R2 and Firebase backup
 */
router.post('/upload-video', upload.single('video'), async (req, res) => {
  try {
    const { userId, title, description, privacy } = req.body;

    if (!userId || !req.file) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check rate limit
    const rateLimit = await SecurityService.checkRateLimit(userId, 'video_upload', 10, 3600000);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Too many uploads. Please try again later.',
        remaining: rateLimit.remaining,
      });
    }

    // Create audit log
    await SecurityService.createAuditLog(userId, 'video_upload', {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      privacy,
    });

    // Upload video
    const result = await MediaStorageService.uploadVideo(req.file.buffer, userId, 'post', {
      title,
      description,
      privacy: privacy || 'public',
      contentType: req.file.mimetype,
      userId,
    });

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      data: result,
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/media/upload-story
 * Upload story (image or video) with 24-hour expiry
 */
router.post('/upload-story', upload.single('story'), async (req, res) => {
  try {
    const { userId, mediaType } = req.body;

    if (!userId || !req.file) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check rate limit
    const rateLimit = await SecurityService.checkRateLimit(userId, 'story_upload', 20, 3600000);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Too many story uploads. Please try again later.',
        remaining: rateLimit.remaining,
      });
    }

    // Create audit log
    await SecurityService.createAuditLog(userId, 'story_upload', {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mediaType,
    });

    // Upload story
    const result = await MediaStorageService.uploadStory(
      req.file.buffer,
      userId,
      mediaType || 'image',
      {
        contentType: req.file.mimetype,
        userId,
      }
    );

    res.json({
      success: true,
      message: 'Story uploaded successfully',
      data: result,
    });
  } catch (error) {
    console.error('Story upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/media/user-media/:userId
 * Get all media for a user
 */
router.get('/user-media/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await MediaStorageService.getUserMediaStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get user media error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/media/signed-url/:fileKey
 * Get signed URL for media access
 */
router.get('/signed-url/:fileKey', async (req, res) => {
  try {
    const { fileKey } = req.params;
    const { expiresIn } = req.query;

    const url = await MediaStorageService.getSignedUrl(fileKey, expiresIn || 24 * 60 * 60);

    res.json({
      success: true,
      url,
    });
  } catch (error) {
    console.error('Get signed URL error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/media/:fileKey
 * Delete media from R2 and Firebase
 */
router.delete('/:fileKey', async (req, res) => {
  try {
    const { fileKey } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Create audit log
    await SecurityService.createAuditLog(userId, 'media_delete', {
      fileKey,
    });

    const result = await MediaStorageService.deleteMedia(fileKey);

    res.json({
      success: true,
      message: 'Media deleted successfully',
      data: result,
    });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/media/sync-backup/:fileKey
 * Sync media to backup (Firebase)
 */
router.post('/sync-backup/:fileKey', async (req, res) => {
  try {
    const { fileKey } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const result = await MediaStorageService.syncMediaToBackup(fileKey);

    res.json({
      success: true,
      message: 'Media synced to backup',
      data: result,
    });
  } catch (error) {
    console.error('Sync backup error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/media/migrate-server/:fileKey
 * Migrate media to custom server (Future feature)
 */
router.post('/migrate-server/:fileKey', async (req, res) => {
  try {
    const { fileKey } = req.params;
    const { userId, customServerUrl } = req.body;

    if (!userId || !customServerUrl) {
      return res.status(400).json({ error: 'User ID and custom server URL required' });
    }

    // Create audit log
    await SecurityService.createAuditLog(userId, 'media_migrate', {
      fileKey,
      customServerUrl,
    });

    const result = await MediaStorageService.migrateToCustomServer(fileKey, customServerUrl);

    res.json({
      success: true,
      message: 'Media migrated to custom server',
      data: result,
    });
  } catch (error) {
    console.error('Migrate server error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/media/security-report/:userId
 * Get security report for user
 */
router.get('/security-report/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const report = await SecurityService.generateSecurityReport(userId);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Security report error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/media/audit-logs/:userId
 * Get audit logs for user
 */
router.get('/audit-logs/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    const logs = await SecurityService.getAuditLogs(userId, limit || 50);

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
