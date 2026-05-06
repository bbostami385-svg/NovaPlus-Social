import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authentication Service
 * Handles JWT tokens, password hashing, and session management
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
export const comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error(`Password comparison failed: ${error.message}`);
  }
};

/**
 * Generate JWT access token
 * @param {string} userId - User ID
 * @param {object} payload - Additional payload data
 * @returns {string} - JWT token
 */
export const generateAccessToken = (userId, payload = {}) => {
  try {
    return jwt.sign(
      {
        userId,
        type: 'access',
        ...payload,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
  } catch (error) {
    throw new Error(`Access token generation failed: ${error.message}`);
  }
};

/**
 * Generate JWT refresh token
 * @param {string} userId - User ID
 * @returns {string} - Refresh token
 */
export const generateRefreshToken = (userId) => {
  try {
    return jwt.sign(
      {
        userId,
        type: 'refresh',
      },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
  } catch (error) {
    throw new Error(`Refresh token generation failed: ${error.message}`);
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @param {string} secret - Secret key (default: JWT_SECRET)
 * @returns {object} - Decoded token
 */
export const verifyToken = (token, secret = JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {object} - New access token and refresh token
 */
export const refreshAccessToken = (refreshToken) => {
  try {
    const decoded = verifyToken(refreshToken, JWT_REFRESH_SECRET);

    const newAccessToken = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    throw new Error(`Token refresh failed: ${error.message}`);
  }
};

/**
 * Store refresh token in database
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<void>}
 */
export const storeRefreshToken = async (userId, refreshToken) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.refreshTokens) {
      user.refreshTokens = [];
    }

    user.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date(),
    });

    // Keep only last 5 refresh tokens
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }

    await user.save();
  } catch (error) {
    throw new Error(`Failed to store refresh token: ${error.message}`);
  }
};

/**
 * Revoke refresh token
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token to revoke
 * @returns {Promise<void>}
 */
export const revokeRefreshToken = async (userId, refreshToken) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.refreshTokens = user.refreshTokens.filter(
      rt => rt.token !== refreshToken
    );

    await user.save();
  } catch (error) {
    throw new Error(`Failed to revoke refresh token: ${error.message}`);
  }
};

/**
 * Revoke all refresh tokens (logout from all devices)
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const revokeAllRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.refreshTokens = [];
    await user.save();
  } catch (error) {
    throw new Error(`Failed to revoke all refresh tokens: ${error.message}`);
  }
};

/**
 * Validate refresh token exists in database
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<boolean>}
 */
export const validateRefreshTokenInDB = async (userId, refreshToken) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return false;
    }

    return user.refreshTokens.some(rt => rt.token === refreshToken);
  } catch (error) {
    return false;
  }
};

/**
 * Generate session token for current session
 * @param {string} userId - User ID
 * @param {string} deviceInfo - Device information
 * @returns {object} - Session data
 */
export const createSession = async (userId, deviceInfo = {}) => {
  try {
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    await storeRefreshToken(userId, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRY,
      tokenType: 'Bearer',
      device: deviceInfo,
    };
  } catch (error) {
    throw new Error(`Session creation failed: ${error.message}`);
  }
};

export default {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  refreshAccessToken,
  storeRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  validateRefreshTokenInDB,
  createSession,
};
