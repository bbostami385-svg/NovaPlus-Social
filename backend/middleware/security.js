import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import redis from 'redis';
import RedisStore from 'rate-limit-redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient;

/**
 * Initialize Redis for rate limiting
 */
export const initializeRedisForRateLimit = async () => {
  try {
    redisClient = redis.createClient({ url: REDIS_URL });
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    await redisClient.connect();
    console.log('Redis connected for rate limiting');
    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis for rate limiting:', error.message);
    throw error;
  }
};

/**
 * General rate limiter (10 requests per 15 minutes)
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  },
});

/**
 * Strict rate limiter for auth endpoints (5 requests per 15 minutes)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * OTP rate limiter (3 requests per 5 minutes)
 */
export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: 'Too many OTP requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * API rate limiter with Redis store (100 requests per 15 minutes per user)
 */
export const createUserRateLimiter = () => {
  if (!redisClient) {
    console.warn('Redis not initialized for rate limiting, using memory store');
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      keyGenerator: (req) => req.userId || req.ip,
    });
  }

  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rate-limit:',
    }),
    windowMs: 15 * 60 * 1000,
    max: 100,
    keyGenerator: (req) => req.userId || req.ip,
    message: 'Too many requests from this account, please try again later.',
  });
};

/**
 * Security headers middleware (Helmet)
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
});

/**
 * Data sanitization middleware
 */
export const dataSanitization = (req, res, next) => {
  // Sanitize data against NoSQL injection
  req.body = mongoSanitize()(req.body);
  req.query = mongoSanitize()(req.query);
  req.params = mongoSanitize()(req.params);

  // Clean XSS attacks
  xss()(req, res, next);
};

/**
 * Parameter pollution prevention middleware
 */
export const preventParameterPollution = hpp({
  whitelist: [
    'sort',
    'fields',
    'page',
    'limit',
    'search',
    'filter',
  ],
});

/**
 * Input validation middleware
 */
export const validateInput = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }

      req.body = value;
      next();
    } catch (err) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: err.message,
      });
    }
  };
};

/**
 * CORS configuration
 */
export const corsConfig = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
};

/**
 * Request logging middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};

/**
 * Error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    status = 400;
    message = 'Duplicate field value entered';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: err }),
  });
};

/**
 * 404 handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
};

export default {
  initializeRedisForRateLimit,
  generalLimiter,
  authLimiter,
  otpLimiter,
  createUserRateLimiter,
  securityHeaders,
  dataSanitization,
  preventParameterPollution,
  validateInput,
  corsConfig,
  requestLogger,
  errorHandler,
  notFoundHandler,
};
