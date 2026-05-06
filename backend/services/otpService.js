import redis from 'redis';
import crypto from 'crypto';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY) || 300; // 5 minutes in seconds

let redisClient;

/**
 * Initialize Redis client
 */
export const initializeRedis = async () => {
  try {
    redisClient = redis.createClient({ url: REDIS_URL });
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis:', error.message);
    throw error;
  }
};

/**
 * Generate 6-digit OTP
 * @returns {string} - 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store OTP in Redis
 * @param {string} identifier - Email or phone number
 * @param {string} otp - OTP code
 * @param {string} type - OTP type (verification, password_reset, 2fa)
 * @returns {Promise<void>}
 */
export const storeOTP = async (identifier, otp, type = 'verification') => {
  try {
    if (!redisClient) {
      throw new Error('Redis client not initialized');
    }

    const key = `otp:${type}:${identifier}`;
    
    // Store OTP with expiry
    await redisClient.setEx(key, OTP_EXPIRY, otp);

    // Store attempt counter
    const attemptKey = `otp:attempts:${type}:${identifier}`;
    await redisClient.setEx(attemptKey, OTP_EXPIRY, '0');

    console.log(`OTP stored for ${identifier} (${type})`);
  } catch (error) {
    console.error(`Failed to store OTP: ${error.message}`);
    throw new Error(`OTP storage failed: ${error.message}`);
  }
};

/**
 * Verify OTP
 * @param {string} identifier - Email or phone number
 * @param {string} otp - OTP code to verify
 * @param {string} type - OTP type
 * @returns {Promise<boolean>} - True if OTP is valid
 */
export const verifyOTP = async (identifier, otp, type = 'verification') => {
  try {
    if (!redisClient) {
      throw new Error('Redis client not initialized');
    }

    const key = `otp:${type}:${identifier}`;
    const storedOTP = await redisClient.get(key);

    if (!storedOTP) {
      throw new Error('OTP expired or not found');
    }

    // Check attempt counter
    const attemptKey = `otp:attempts:${type}:${identifier}`;
    const attempts = parseInt(await redisClient.get(attemptKey)) || 0;

    if (attempts >= 5) {
      // Delete OTP after 5 failed attempts
      await redisClient.del(key);
      throw new Error('Too many failed attempts. Please request a new OTP.');
    }

    if (storedOTP !== otp) {
      // Increment attempt counter
      await redisClient.incr(attemptKey);
      throw new Error('Invalid OTP');
    }

    // Delete OTP after successful verification
    await redisClient.del(key);
    await redisClient.del(attemptKey);

    console.log(`OTP verified for ${identifier} (${type})`);
    return true;
  } catch (error) {
    console.error(`OTP verification failed: ${error.message}`);
    throw error;
  }
};

/**
 * Get OTP attempts
 * @param {string} identifier - Email or phone number
 * @param {string} type - OTP type
 * @returns {Promise<number>} - Number of attempts
 */
export const getOTPAttempts = async (identifier, type = 'verification') => {
  try {
    if (!redisClient) {
      throw new Error('Redis client not initialized');
    }

    const attemptKey = `otp:attempts:${type}:${identifier}`;
    const attempts = await redisClient.get(attemptKey);
    
    return parseInt(attempts) || 0;
  } catch (error) {
    console.error(`Failed to get OTP attempts: ${error.message}`);
    return 0;
  }
};

/**
 * Delete OTP
 * @param {string} identifier - Email or phone number
 * @param {string} type - OTP type
 * @returns {Promise<void>}
 */
export const deleteOTP = async (identifier, type = 'verification') => {
  try {
    if (!redisClient) {
      throw new Error('Redis client not initialized');
    }

    const key = `otp:${type}:${identifier}`;
    const attemptKey = `otp:attempts:${type}:${identifier}`;

    await redisClient.del(key);
    await redisClient.del(attemptKey);

    console.log(`OTP deleted for ${identifier} (${type})`);
  } catch (error) {
    console.error(`Failed to delete OTP: ${error.message}`);
    throw error;
  }
};

/**
 * Check if OTP exists
 * @param {string} identifier - Email or phone number
 * @param {string} type - OTP type
 * @returns {Promise<boolean>} - True if OTP exists
 */
export const otpExists = async (identifier, type = 'verification') => {
  try {
    if (!redisClient) {
      throw new Error('Redis client not initialized');
    }

    const key = `otp:${type}:${identifier}`;
    const exists = await redisClient.exists(key);
    
    return exists === 1;
  } catch (error) {
    console.error(`Failed to check OTP existence: ${error.message}`);
    return false;
  }
};

/**
 * Get OTP TTL (time to live)
 * @param {string} identifier - Email or phone number
 * @param {string} type - OTP type
 * @returns {Promise<number>} - TTL in seconds (-1 if no expiry, -2 if not exists)
 */
export const getOTPTTL = async (identifier, type = 'verification') => {
  try {
    if (!redisClient) {
      throw new Error('Redis client not initialized');
    }

    const key = `otp:${type}:${identifier}`;
    const ttl = await redisClient.ttl(key);
    
    return ttl;
  } catch (error) {
    console.error(`Failed to get OTP TTL: ${error.message}`);
    return -2;
  }
};

/**
 * Generate and store OTP in one call
 * @param {string} identifier - Email or phone number
 * @param {string} type - OTP type
 * @returns {Promise<string>} - Generated OTP
 */
export const generateAndStoreOTP = async (identifier, type = 'verification') => {
  try {
    const otp = generateOTP();
    await storeOTP(identifier, otp, type);
    return otp;
  } catch (error) {
    console.error(`Failed to generate and store OTP: ${error.message}`);
    throw error;
  }
};

export default {
  initializeRedis,
  generateOTP,
  storeOTP,
  verifyOTP,
  getOTPAttempts,
  deleteOTP,
  otpExists,
  getOTPTTL,
  generateAndStoreOTP,
};
