import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { verifyFirebaseToken } from '../config/firebase.js';

// Verify JWT Token
export const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message,
    });
  }
};

// Verify Firebase Token
export const verifyFirebaseAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No Firebase token provided',
      });
    }

    const decodedToken = await verifyFirebaseToken(token);
    req.firebaseUser = decodedToken;

    // Find or create user in database
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      user = new User({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        firstName: decodedToken.name?.split(' ')[0] || 'User',
        lastName: decodedToken.name?.split(' ')[1] || '',
        username: decodedToken.email?.split('@')[0] || `user_${Date.now()}`,
        profilePicture: decodedToken.picture,
        loginMethod: 'google',
      });
      await user.save();
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Firebase authentication failed',
      error: error.message,
    });
  }
};

// Check if user is authenticated
export const isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }
  next();
};

// Check if user is admin
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking admin status',
      error: error.message,
    });
  }
};

// Check if user is verified
export const isVerified = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking verification status',
      error: error.message,
    });
  }
};

// Check if user is not banned
export const isNotBanned = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user || user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been banned',
        reason: user?.banReason,
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking ban status',
      error: error.message,
    });
  }
};

// Rate limiting middleware
export const rateLimit = (maxRequests = 100, windowMs = 900000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const userRequests = requests.get(key) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter((time) => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
      });
    }

    recentRequests.push(now);
    requests.set(key, recentRequests);

    // Cleanup old entries
    if (requests.size > 10000) {
      requests.clear();
    }

    next();
  };
};

export default {
  verifyToken,
  verifyFirebaseAuth,
  isAuthenticated,
  isAdmin,
  isVerified,
  isNotBanned,
  rateLimit,
};
