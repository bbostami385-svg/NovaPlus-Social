import AWS from 'aws-sdk';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

/**
 * MediaStorageService
 * Handles video, stories, and media storage with R2 (Cloudflare) and Firebase
 * Future-ready for migration to custom server
 */

class MediaStorageService {
  constructor() {
    // R2 Configuration (Cloudflare)
    this.r2Client = new AWS.S3({
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      endpoint: process.env.R2_ENDPOINT,
      s3ForcePathStyle: false,
      signatureVersion: 'v4',
      region: 'auto',
    });

    this.r2Bucket = process.env.R2_BUCKET_NAME || 'novaplus-media';
    this.r2PublicUrl = process.env.R2_PUBLIC_URL || 'https://media.novaplus.social';

    // Firebase Storage
    this.firebaseStorage = admin.storage();
    this.firebaseBucket = this.firebaseStorage.bucket();
  }

  /**
   * Upload video to R2 with Firebase backup
   * @param {Buffer} fileBuffer - Video file buffer
   * @param {string} userId - User ID
   * @param {string} videoType - 'story' or 'post'
   * @param {Object} metadata - Additional metadata
   * @returns {Object} - Upload result with URLs and metadata
   */
  async uploadVideo(fileBuffer, userId, videoType = 'post', metadata = {}) {
    try {
      const fileId = uuidv4();
      const timestamp = Date.now();
      const fileName = `videos/${videoType}/${userId}/${timestamp}-${fileId}.mp4`;

      // Upload to R2 (Primary storage)
      const r2Result = await this.uploadToR2(fileBuffer, fileName, metadata);

      // Upload to Firebase (Backup)
      const firebaseResult = await this.uploadToFirebase(fileBuffer, fileName, metadata);

      // Store metadata in database
      const storageMetadata = {
        fileId,
        fileName,
        userId,
        videoType,
        fileSize: fileBuffer.length,
        uploadedAt: new Date(),
        r2Url: r2Result.url,
        firebaseUrl: firebaseResult.url,
        r2Key: r2Result.key,
        firebaseKey: firebaseResult.key,
        status: 'active',
        backupStatus: 'synced',
        metadata: metadata,
      };

      return storageMetadata;
    } catch (error) {
      console.error('Video upload error:', error);
      throw new Error(`Failed to upload video: ${error.message}`);
    }
  }

  /**
   * Upload story to R2 with Firebase backup
   * @param {Buffer} fileBuffer - Story file buffer (image or video)
   * @param {string} userId - User ID
   * @param {string} mediaType - 'image' or 'video'
   * @param {Object} metadata - Additional metadata
   * @returns {Object} - Upload result
   */
  async uploadStory(fileBuffer, userId, mediaType = 'image', metadata = {}) {
    try {
      const fileId = uuidv4();
      const timestamp = Date.now();
      const extension = mediaType === 'image' ? '.jpg' : '.mp4';
      const fileName = `stories/${userId}/${timestamp}-${fileId}${extension}`;

      // Upload to R2
      const r2Result = await this.uploadToR2(fileBuffer, fileName, {
        ...metadata,
        mediaType,
        expiresIn: 24 * 60 * 60, // 24 hours for stories
      });

      // Upload to Firebase
      const firebaseResult = await this.uploadToFirebase(fileBuffer, fileName, metadata);

      const storageMetadata = {
        fileId,
        fileName,
        userId,
        mediaType,
        fileSize: fileBuffer.length,
        uploadedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        r2Url: r2Result.url,
        firebaseUrl: firebaseResult.url,
        r2Key: r2Result.key,
        firebaseKey: firebaseResult.key,
        status: 'active',
        backupStatus: 'synced',
        metadata: metadata,
      };

      return storageMetadata;
    } catch (error) {
      console.error('Story upload error:', error);
      throw new Error(`Failed to upload story: ${error.message}`);
    }
  }

  /**
   * Upload to R2 (Cloudflare)
   * @private
   */
  async uploadToR2(fileBuffer, fileName, metadata = {}) {
    try {
      const params = {
        Bucket: this.r2Bucket,
        Key: fileName,
        Body: fileBuffer,
        ContentType: metadata.contentType || 'application/octet-stream',
        Metadata: {
          userId: metadata.userId || 'unknown',
          uploadedAt: new Date().toISOString(),
          ...metadata,
        },
      };

      const result = await this.r2Client.upload(params).promise();

      return {
        key: result.Key,
        url: `${this.r2PublicUrl}/${result.Key}`,
        etag: result.ETag,
        location: result.Location,
      };
    } catch (error) {
      console.error('R2 upload error:', error);
      throw error;
    }
  }

  /**
   * Upload to Firebase Storage (Backup)
   * @private
   */
  async uploadToFirebase(fileBuffer, fileName, metadata = {}) {
    try {
      const file = this.firebaseBucket.file(fileName);

      await file.save(fileBuffer, {
        metadata: {
          contentType: metadata.contentType || 'application/octet-stream',
          metadata: {
            userId: metadata.userId || 'unknown',
            uploadedAt: new Date().toISOString(),
            ...metadata,
          },
        },
      });

      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return {
        key: fileName,
        url: url,
        bucket: this.firebaseBucket.name,
      };
    } catch (error) {
      console.error('Firebase upload error:', error);
      throw error;
    }
  }

  /**
   * Delete video/story from both R2 and Firebase
   * @param {string} fileKey - File key/path
   * @returns {Object} - Deletion result
   */
  async deleteMedia(fileKey) {
    try {
      // Delete from R2
      const r2Delete = await this.r2Client
        .deleteObject({
          Bucket: this.r2Bucket,
          Key: fileKey,
        })
        .promise();

      // Delete from Firebase
      const firebaseDelete = await this.firebaseBucket.file(fileKey).delete();

      return {
        success: true,
        r2Deleted: true,
        firebaseDeleted: true,
        deletedAt: new Date(),
      };
    } catch (error) {
      console.error('Media deletion error:', error);
      throw new Error(`Failed to delete media: ${error.message}`);
    }
  }

  /**
   * Get signed URL for media (valid for 24 hours)
   * @param {string} fileKey - File key/path
   * @param {number} expiresIn - Expiration time in seconds
   * @returns {string} - Signed URL
   */
  async getSignedUrl(fileKey, expiresIn = 24 * 60 * 60) {
    try {
      const params = {
        Bucket: this.r2Bucket,
        Key: fileKey,
        Expires: expiresIn,
      };

      const url = await this.r2Client.getSignedUrlPromise('getObject', params);
      return url;
    } catch (error) {
      console.error('Signed URL error:', error);
      throw error;
    }
  }

  /**
   * List all media files for a user
   * @param {string} userId - User ID
   * @param {string} type - 'videos' or 'stories'
   * @returns {Array} - List of files
   */
  async listUserMedia(userId, type = 'videos') {
    try {
      const params = {
        Bucket: this.r2Bucket,
        Prefix: `${type}/${userId}/`,
      };

      const result = await this.r2Client.listObjectsV2(params).promise();

      return (result.Contents || []).map((item) => ({
        key: item.Key,
        url: `${this.r2PublicUrl}/${item.Key}`,
        size: item.Size,
        lastModified: item.LastModified,
      }));
    } catch (error) {
      console.error('List media error:', error);
      throw error;
    }
  }

  /**
   * Sync media between R2 and Firebase
   * @param {string} fileKey - File key to sync
   * @returns {Object} - Sync result
   */
  async syncMediaToBackup(fileKey) {
    try {
      // Get file from R2
      const r2File = await this.r2Client
        .getObject({
          Bucket: this.r2Bucket,
          Key: fileKey,
        })
        .promise();

      // Upload to Firebase
      const firebaseResult = await this.uploadToFirebase(r2File.Body, fileKey, {
        contentType: r2File.ContentType,
      });

      return {
        success: true,
        fileKey,
        r2Status: 'synced',
        firebaseStatus: 'synced',
        syncedAt: new Date(),
      };
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  }

  /**
   * Get media statistics for a user
   * @param {string} userId - User ID
   * @returns {Object} - Storage statistics
   */
  async getUserMediaStats(userId) {
    try {
      const videos = await this.listUserMedia(userId, 'videos');
      const stories = await this.listUserMedia(userId, 'stories');

      const totalSize = [
        ...videos.map((v) => v.size),
        ...stories.map((s) => s.size),
      ].reduce((a, b) => a + b, 0);

      return {
        userId,
        videoCount: videos.length,
        storyCount: stories.length,
        totalMediaCount: videos.length + stories.length,
        totalStorageUsed: totalSize,
        totalStorageUsedMB: (totalSize / 1024 / 1024).toFixed(2),
        videos,
        stories,
      };
    } catch (error) {
      console.error('Stats error:', error);
      throw error;
    }
  }

  /**
   * Migrate media from R2 to custom server
   * Future-ready for self-hosted migration
   * @param {string} fileKey - File key to migrate
   * @param {string} customServerUrl - Custom server endpoint
   * @returns {Object} - Migration result
   */
  async migrateToCustomServer(fileKey, customServerUrl) {
    try {
      // Get file from R2
      const r2File = await this.r2Client
        .getObject({
          Bucket: this.r2Bucket,
          Key: fileKey,
        })
        .promise();

      // Upload to custom server
      const formData = new FormData();
      formData.append('file', new Blob([r2File.Body]));
      formData.append('fileKey', fileKey);

      const response = await fetch(`${customServerUrl}/api/media/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Custom server upload failed');
      }

      const result = await response.json();

      return {
        success: true,
        fileKey,
        customServerUrl: result.url,
        migratedAt: new Date(),
        status: 'migrated',
      };
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  }
}

export default new MediaStorageService();
