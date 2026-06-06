import crypto from 'crypto';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';

/**
 * SecurityService
 * Handles encryption, security, and data protection
 * Integrated with Firebase Security for backup
 */

class SecurityService {
  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
    this.algorithm = 'aes-256-gcm';
    this.firebaseDb = admin.firestore();
  }

  /**
   * Encrypt sensitive data
   * @param {string} data - Data to encrypt
   * @returns {Object} - Encrypted data with IV and auth tag
   */
  encryptData(data) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm: this.algorithm,
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   * @param {Object} encryptedData - Encrypted data object
   * @returns {Object} - Decrypted data
   */
  decryptData(encryptedData) {
    try {
      const decipher = crypto.createDecipheriv(
        encryptedData.algorithm,
        this.encryptionKey,
        Buffer.from(encryptedData.iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data (one-way)
   * @param {string} data - Data to hash
   * @returns {string} - Hashed data
   */
  async hashData(data) {
    try {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(data, salt);
    } catch (error) {
      console.error('Hash error:', error);
      throw error;
    }
  }

  /**
   * Compare data with hash
   * @param {string} data - Original data
   * @param {string} hash - Hashed data
   * @returns {boolean} - Match result
   */
  async compareData(data, hash) {
    try {
      return await bcrypt.compare(data, hash);
    } catch (error) {
      console.error('Compare error:', error);
      throw error;
    }
  }

  /**
   * Generate secure token
   * @param {number} length - Token length
   * @returns {string} - Secure token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt and store sensitive data in Firebase
   * @param {string} userId - User ID
   * @param {string} dataType - Type of data (e.g., 'payment', 'identity')
   * @param {Object} data - Data to store
   * @returns {Object} - Storage result
   */
  async storeEncryptedData(userId, dataType, data) {
    try {
      const encryptedData = this.encryptData(data);

      await this.firebaseDb.collection('encrypted_data').doc(`${userId}_${dataType}`).set({
        userId,
        dataType,
        encrypted: encryptedData.encrypted,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
        algorithm: encryptedData.algorithm,
        storedAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        success: true,
        userId,
        dataType,
        storedAt: new Date(),
      };
    } catch (error) {
      console.error('Store encrypted data error:', error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt sensitive data from Firebase
   * @param {string} userId - User ID
   * @param {string} dataType - Type of data
   * @returns {Object} - Decrypted data
   */
  async retrieveEncryptedData(userId, dataType) {
    try {
      const doc = await this.firebaseDb
        .collection('encrypted_data')
        .doc(`${userId}_${dataType}`)
        .get();

      if (!doc.exists) {
        throw new Error('Data not found');
      }

      const encryptedData = doc.data();
      return this.decryptData({
        encrypted: encryptedData.encrypted,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
        algorithm: encryptedData.algorithm,
      });
    } catch (error) {
      console.error('Retrieve encrypted data error:', error);
      throw error;
    }
  }

  /**
   * Create audit log for security events
   * @param {string} userId - User ID
   * @param {string} action - Action performed
   * @param {Object} details - Action details
   * @param {string} ipAddress - User IP address
   * @returns {Object} - Audit log result
   */
  async createAuditLog(userId, action, details = {}, ipAddress = null) {
    try {
      const auditLog = {
        userId,
        action,
        details,
        ipAddress,
        timestamp: new Date(),
        userAgent: details.userAgent || null,
        status: details.status || 'success',
      };

      await this.firebaseDb.collection('audit_logs').add(auditLog);

      return {
        success: true,
        logId: auditLog.timestamp.getTime(),
        action,
      };
    } catch (error) {
      console.error('Audit log error:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of logs to retrieve
   * @returns {Array} - Audit logs
   */
  async getAuditLogs(userId, limit = 50) {
    try {
      const snapshot = await this.firebaseDb
        .collection('audit_logs')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Get audit logs error:', error);
      throw error;
    }
  }

  /**
   * Detect suspicious activity
   * @param {string} userId - User ID
   * @param {string} action - Action to check
   * @param {Object} context - Action context
   * @returns {Object} - Risk assessment
   */
  async detectSuspiciousActivity(userId, action, context = {}) {
    try {
      const recentLogs = await this.getAuditLogs(userId, 100);

      // Check for unusual patterns
      const lastHourLogs = recentLogs.filter(
        (log) => new Date() - new Date(log.timestamp) < 60 * 60 * 1000
      );

      const riskFactors = {
        frequentFailedLogins: lastHourLogs.filter((l) => l.action === 'login' && l.status === 'failed')
          .length > 5,
        multipleIpAddresses: new Set(lastHourLogs.map((l) => l.ipAddress)).size > 3,
        unusualTime: this.isUnusualTime(),
        rapidActionSequence: lastHourLogs.length > 20,
      };

      const riskScore = Object.values(riskFactors).filter(Boolean).length;

      return {
        userId,
        action,
        riskScore,
        riskLevel: riskScore >= 3 ? 'high' : riskScore >= 1 ? 'medium' : 'low',
        riskFactors,
        flagged: riskScore >= 3,
      };
    } catch (error) {
      console.error('Suspicious activity detection error:', error);
      throw error;
    }
  }

  /**
   * Check if current time is unusual for user
   * @private
   */
  isUnusualTime() {
    const hour = new Date().getHours();
    return hour < 6 || hour > 23; // Unusual if between 12 AM - 6 AM
  }

  /**
   * Implement rate limiting
   * @param {string} userId - User ID
   * @param {string} action - Action to limit
   * @param {number} maxAttempts - Max attempts allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Object} - Rate limit result
   */
  async checkRateLimit(userId, action, maxAttempts = 5, windowMs = 60000) {
    try {
      const key = `ratelimit:${userId}:${action}`;
      const currentAttempts = await this.firebaseDb.collection('rate_limits').doc(key).get();

      const now = Date.now();
      let attempts = 1;
      let firstAttemptTime = now;

      if (currentAttempts.exists) {
        const data = currentAttempts.data();
        if (now - data.firstAttemptTime < windowMs) {
          attempts = data.attempts + 1;
          firstAttemptTime = data.firstAttemptTime;
        }
      }

      await this.firebaseDb.collection('rate_limits').doc(key).set({
        userId,
        action,
        attempts,
        firstAttemptTime,
        lastAttemptTime: now,
      });

      return {
        allowed: attempts <= maxAttempts,
        attempts,
        maxAttempts,
        remaining: Math.max(0, maxAttempts - attempts),
      };
    } catch (error) {
      console.error('Rate limit error:', error);
      throw error;
    }
  }

  /**
   * Generate security report
   * @param {string} userId - User ID
   * @returns {Object} - Security report
   */
  async generateSecurityReport(userId) {
    try {
      const auditLogs = await this.getAuditLogs(userId, 100);
      const suspiciousActivity = await this.detectSuspiciousActivity(userId, 'report');

      const report = {
        userId,
        generatedAt: new Date(),
        totalActions: auditLogs.length,
        failedLogins: auditLogs.filter((l) => l.action === 'login' && l.status === 'failed').length,
        passwordChanges: auditLogs.filter((l) => l.action === 'password_change').length,
        dataAccess: auditLogs.filter((l) => l.action === 'data_access').length,
        suspiciousActivity,
        recommendations: this.generateSecurityRecommendations(suspiciousActivity),
      };

      return report;
    } catch (error) {
      console.error('Security report error:', error);
      throw error;
    }
  }

  /**
   * Generate security recommendations
   * @private
   */
  generateSecurityRecommendations(suspiciousActivity) {
    const recommendations = [];

    if (suspiciousActivity.riskFactors.frequentFailedLogins) {
      recommendations.push('Consider enabling two-factor authentication');
    }

    if (suspiciousActivity.riskFactors.multipleIpAddresses) {
      recommendations.push('Review login locations and devices');
    }

    if (suspiciousActivity.riskFactors.unusualTime) {
      recommendations.push('Activity detected at unusual time');
    }

    if (suspiciousActivity.riskFactors.rapidActionSequence) {
      recommendations.push('Unusual number of actions detected');
    }

    if (recommendations.length === 0) {
      recommendations.push('Your account appears secure');
    }

    return recommendations;
  }
}

export default new SecurityService();
