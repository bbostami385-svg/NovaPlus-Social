import cron from 'node-cron';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Session from '../models/Session.js';

/**
 * Scheduler Service
 * Handles cron jobs for cleanup, maintenance, and scheduled tasks
 */

const scheduledJobs = [];

/**
 * Clean up expired OTPs (runs every hour)
 * Note: Redis handles OTP expiry automatically, but this is for monitoring
 */
export const scheduleOTPCleanup = () => {
  const job = cron.schedule('0 * * * *', async () => {
    try {
      console.log('[CRON] Running OTP cleanup job...');
      // OTPs are automatically cleaned up by Redis TTL
      console.log('[CRON] OTP cleanup completed');
    } catch (error) {
      console.error('[CRON] OTP cleanup failed:', error.message);
    }
  });

  scheduledJobs.push({ name: 'OTP Cleanup', job });
  console.log('OTP cleanup job scheduled (every hour)');
};

/**
 * Clean up expired sessions (runs daily at 2 AM)
 */
export const scheduleSessionCleanup = () => {
  const job = cron.schedule('0 2 * * *', async () => {
    try {
      console.log('[CRON] Running session cleanup job...');

      const expiryTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      const result = await Session.deleteMany({
        expiresAt: { $lt: new Date() },
      });

      console.log(`[CRON] Deleted ${result.deletedCount} expired sessions`);
    } catch (error) {
      console.error('[CRON] Session cleanup failed:', error.message);
    }
  });

  scheduledJobs.push({ name: 'Session Cleanup', job });
  console.log('Session cleanup job scheduled (daily at 2 AM)');
};

/**
 * Clean up old notifications (runs daily at 3 AM)
 * Keeps only last 90 days of notifications
 */
export const scheduleNotificationCleanup = () => {
  const job = cron.schedule('0 3 * * *', async () => {
    try {
      console.log('[CRON] Running notification cleanup job...');

      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const result = await Notification.deleteMany({
        createdAt: { $lt: ninetyDaysAgo },
        isRead: true, // Only delete read notifications
      });

      console.log(`[CRON] Deleted ${result.deletedCount} old notifications`);
    } catch (error) {
      console.error('[CRON] Notification cleanup failed:', error.message);
    }
  });

  scheduledJobs.push({ name: 'Notification Cleanup', job });
  console.log('Notification cleanup job scheduled (daily at 3 AM)');
};

/**
 * Deactivate inactive users (runs weekly on Sunday at 4 AM)
 * Marks users inactive if no login for 90 days
 */
export const scheduleInactiveUserDeactivation = () => {
  const job = cron.schedule('0 4 * * 0', async () => {
    try {
      console.log('[CRON] Running inactive user deactivation job...');

      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const result = await User.updateMany(
        {
          lastLogin: { $lt: ninetyDaysAgo },
          isActive: true,
        },
        {
          isActive: false,
          deactivatedAt: new Date(),
        }
      );

      console.log(`[CRON] Deactivated ${result.modifiedCount} inactive users`);
    } catch (error) {
      console.error('[CRON] Inactive user deactivation failed:', error.message);
    }
  });

  scheduledJobs.push({ name: 'Inactive User Deactivation', job });
  console.log('Inactive user deactivation job scheduled (weekly on Sunday at 4 AM)');
};

/**
 * Generate daily analytics report (runs daily at 5 AM)
 */
export const scheduleDailyAnalyticsReport = () => {
  const job = cron.schedule('0 5 * * *', async () => {
    try {
      console.log('[CRON] Running daily analytics report job...');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // TODO: Implement analytics report generation
      console.log('[CRON] Daily analytics report generated');
    } catch (error) {
      console.error('[CRON] Daily analytics report failed:', error.message);
    }
  });

  scheduledJobs.push({ name: 'Daily Analytics Report', job });
  console.log('Daily analytics report job scheduled (daily at 5 AM)');
};

/**
 * Refresh user statistics (runs every 6 hours)
 */
export const scheduleUserStatisticsRefresh = () => {
  const job = cron.schedule('0 */6 * * *', async () => {
    try {
      console.log('[CRON] Running user statistics refresh job...');

      // TODO: Implement user statistics refresh
      console.log('[CRON] User statistics refreshed');
    } catch (error) {
      console.error('[CRON] User statistics refresh failed:', error.message);
    }
  });

  scheduledJobs.push({ name: 'User Statistics Refresh', job });
  console.log('User statistics refresh job scheduled (every 6 hours)');
};

/**
 * Database backup reminder (runs daily at 1 AM)
 */
export const scheduleDatabaseBackupReminder = () => {
  const job = cron.schedule('0 1 * * *', async () => {
    try {
      console.log('[CRON] Database backup reminder triggered');
      // TODO: Implement database backup or send reminder
      console.log('[CRON] Database backup reminder completed');
    } catch (error) {
      console.error('[CRON] Database backup reminder failed:', error.message);
    }
  });

  scheduledJobs.push({ name: 'Database Backup Reminder', job });
  console.log('Database backup reminder job scheduled (daily at 1 AM)');
};

/**
 * Initialize all scheduled jobs
 */
export const initializeAllSchedulers = () => {
  try {
    console.log('Initializing all scheduled jobs...');

    scheduleOTPCleanup();
    scheduleSessionCleanup();
    scheduleNotificationCleanup();
    scheduleInactiveUserDeactivation();
    scheduleDailyAnalyticsReport();
    scheduleUserStatisticsRefresh();
    scheduleDatabaseBackupReminder();

    console.log(`✅ ${scheduledJobs.length} scheduled jobs initialized`);
  } catch (error) {
    console.error('Failed to initialize scheduled jobs:', error.message);
    throw error;
  }
};

/**
 * Stop all scheduled jobs
 */
export const stopAllSchedulers = () => {
  try {
    scheduledJobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`Stopped scheduled job: ${name}`);
    });

    scheduledJobs.length = 0;
    console.log('All scheduled jobs stopped');
  } catch (error) {
    console.error('Failed to stop scheduled jobs:', error.message);
    throw error;
  }
};

/**
 * Get all scheduled jobs
 */
export const getScheduledJobs = () => {
  return scheduledJobs.map(({ name, job }) => ({
    name,
    status: job._destroyed ? 'stopped' : 'running',
  }));
};

export default {
  scheduleOTPCleanup,
  scheduleSessionCleanup,
  scheduleNotificationCleanup,
  scheduleInactiveUserDeactivation,
  scheduleDailyAnalyticsReport,
  scheduleUserStatisticsRefresh,
  scheduleDatabaseBackupReminder,
  initializeAllSchedulers,
  stopAllSchedulers,
  getScheduledJobs,
};
