import { Queue, Worker, QueueScheduler } from 'bullmq';
import redis from 'redis';
import { sendVerificationEmail, sendPasswordResetEmail, send2FAEmail, sendWelcomeEmail } from './emailService.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
};

/**
 * Queue Service
 * Manages job queues for emails and notifications using BullMQ
 */

// Initialize queues
export const emailQueue = new Queue('emails', { connection: redisConnection });
export const notificationQueue = new Queue('notifications', { connection: redisConnection });
export const analyticsQueue = new Queue('analytics', { connection: redisConnection });

// Initialize queue schedulers for delayed jobs
export const emailScheduler = new QueueScheduler('emails', { connection: redisConnection });
export const notificationScheduler = new QueueScheduler('notifications', { connection: redisConnection });
export const analyticsScheduler = new QueueScheduler('analytics', { connection: redisConnection });

/**
 * Add email job to queue
 * @param {string} type - Email type (verification, password_reset, 2fa, welcome)
 * @param {object} data - Email data
 * @param {object} options - Job options
 * @returns {Promise<Job>}
 */
export const addEmailJob = async (type, data, options = {}) => {
  try {
    const job = await emailQueue.add(type, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      ...options,
    });

    console.log(`Email job added: ${type} (Job ID: ${job.id})`);
    return job;
  } catch (error) {
    console.error(`Failed to add email job: ${error.message}`);
    throw error;
  }
};

/**
 * Add notification job to queue
 * @param {string} type - Notification type
 * @param {object} data - Notification data
 * @param {object} options - Job options
 * @returns {Promise<Job>}
 */
export const addNotificationJob = async (type, data, options = {}) => {
  try {
    const job = await notificationQueue.add(type, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      ...options,
    });

    console.log(`Notification job added: ${type} (Job ID: ${job.id})`);
    return job;
  } catch (error) {
    console.error(`Failed to add notification job: ${error.message}`);
    throw error;
  }
};

/**
 * Add analytics job to queue
 * @param {string} type - Analytics type
 * @param {object} data - Analytics data
 * @param {object} options - Job options
 * @returns {Promise<Job>}
 */
export const addAnalyticsJob = async (type, data, options = {}) => {
  try {
    const job = await analyticsQueue.add(type, data, {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      ...options,
    });

    console.log(`Analytics job added: ${type} (Job ID: ${job.id})`);
    return job;
  } catch (error) {
    console.error(`Failed to add analytics job: ${error.message}`);
    throw error;
  }
};

/**
 * Initialize email worker
 */
export const initializeEmailWorker = () => {
  const emailWorker = new Worker('emails', async (job) => {
    try {
      const { type, email, code, resetLink, userName } = job.data;

      switch (type) {
        case 'verification':
          await sendVerificationEmail(email, code, userName);
          break;
        case 'password_reset':
          await sendPasswordResetEmail(email, code, resetLink, userName);
          break;
        case '2fa':
          await send2FAEmail(email, code, userName);
          break;
        case 'welcome':
          await sendWelcomeEmail(email, userName);
          break;
        default:
          throw new Error(`Unknown email type: ${type}`);
      }

      return { success: true, type, email };
    } catch (error) {
      console.error(`Email worker error: ${error.message}`);
      throw error;
    }
  }, { connection: redisConnection });

  emailWorker.on('completed', (job) => {
    console.log(`Email job completed: ${job.id}`);
  });

  emailWorker.on('failed', (job, err) => {
    console.error(`Email job failed: ${job.id} - ${err.message}`);
  });

  return emailWorker;
};

/**
 * Initialize notification worker
 */
export const initializeNotificationWorker = () => {
  const notificationWorker = new Worker('notifications', async (job) => {
    try {
      const { type, userId, message, data } = job.data;

      // TODO: Implement notification logic
      console.log(`Processing notification: ${type} for user ${userId}`);

      return { success: true, type, userId };
    } catch (error) {
      console.error(`Notification worker error: ${error.message}`);
      throw error;
    }
  }, { connection: redisConnection });

  notificationWorker.on('completed', (job) => {
    console.log(`Notification job completed: ${job.id}`);
  });

  notificationWorker.on('failed', (job, err) => {
    console.error(`Notification job failed: ${job.id} - ${err.message}`);
  });

  return notificationWorker;
};

/**
 * Initialize analytics worker
 */
export const initializeAnalyticsWorker = () => {
  const analyticsWorker = new Worker('analytics', async (job) => {
    try {
      const { type, userId, data } = job.data;

      // TODO: Implement analytics logic
      console.log(`Processing analytics: ${type} for user ${userId}`);

      return { success: true, type, userId };
    } catch (error) {
      console.error(`Analytics worker error: ${error.message}`);
      throw error;
    }
  }, { connection: redisConnection });

  analyticsWorker.on('completed', (job) => {
    console.log(`Analytics job completed: ${job.id}`);
  });

  analyticsWorker.on('failed', (job, err) => {
    console.error(`Analytics job failed: ${job.id} - ${err.message}`);
  });

  return analyticsWorker;
};

/**
 * Get queue stats
 * @returns {Promise<object>} - Queue statistics
 */
export const getQueueStats = async () => {
  try {
    const emailStats = await emailQueue.getJobCounts();
    const notificationStats = await notificationQueue.getJobCounts();
    const analyticsStats = await analyticsQueue.getJobCounts();

    return {
      email: emailStats,
      notification: notificationStats,
      analytics: analyticsStats,
    };
  } catch (error) {
    console.error(`Failed to get queue stats: ${error.message}`);
    return null;
  }
};

/**
 * Clear queue
 * @param {string} queueName - Queue name
 * @returns {Promise<void>}
 */
export const clearQueue = async (queueName) => {
  try {
    let queue;
    
    switch (queueName) {
      case 'emails':
        queue = emailQueue;
        break;
      case 'notifications':
        queue = notificationQueue;
        break;
      case 'analytics':
        queue = analyticsQueue;
        break;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }

    await queue.clean(0, 100000);
    console.log(`Queue cleared: ${queueName}`);
  } catch (error) {
    console.error(`Failed to clear queue: ${error.message}`);
    throw error;
  }
};

export default {
  emailQueue,
  notificationQueue,
  analyticsQueue,
  addEmailJob,
  addNotificationJob,
  addAnalyticsJob,
  initializeEmailWorker,
  initializeNotificationWorker,
  initializeAnalyticsWorker,
  getQueueStats,
  clearQueue,
};
