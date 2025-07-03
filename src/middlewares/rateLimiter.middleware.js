import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisService from '../config/redis.js';
import logger from '../loggers/winston.logger.js';

/**
 * Create Redis store for rate limiter
 * @param {string} prefix - Redis key prefix
 * @returns {RedisStore|undefined} Redis store instance or undefined if Redis is not available
 */
const createRedisStore = (prefix) => {
  try {
    // Check if Redis client is available and connected
    if (redisService.client && redisService.isConnected()) {
      return new RedisStore({
        sendCommand: (...args) => redisService.client.call(...args),
        prefix: prefix,
      });
    }
    return undefined;
  } catch (error) {
    logger.warn(`Redis store creation failed: ${error.message}`);
    return undefined;
  }
};

/**
 * Rate limiter factory that creates rate limiters with Redis or memory store
 * In testing environment, rate limiting is disabled to prevent test failures
 */
const createRateLimiterWithFallback = (options) => {
  let limiter = null;

  return (req, res, next) => {
    // Bypass rate limiting in testing environment
    if (process.env.NODE_ENV === 'testing') {
      return next();
    }

    // Create the rate limiter only once per middleware instance
    if (!limiter) {
      const redisStore = createRedisStore(options.storePrefix);
      if (redisStore) {
        logger.info(
          `Using Redis store for rate limiting: ${options.storePrefix}`
        );
        limiter = rateLimit({
          ...options,
          store: redisStore,
        });
      } else {
        logger.warn(
          `Using memory store for rate limiting: ${options.storePrefix}`
        );
        limiter = rateLimit({
          ...options,
          // No store specified, will use default memory store
        });
      }
    }

    return limiter(req, res, next);
  };
};

/**
 * Rate limiter for registration route
 * Limits requests to 5 per minute per IP address
 */
export const registerRateLimiter = createRateLimiterWithFallback({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute per IP
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  storePrefix: 'rl:register:', // Redis key prefix for registration rate limiting

  // Custom message when rate limit is exceeded
  message: {
    status: 'error',
    statusCode: 429,
    message:
      'Too many registration attempts from this IP, please try again in a minute.',
    details: {
      retryAfter: '60 seconds',
      maxRequests: 5,
      windowMs: 60000,
    },
  },

  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message:
        'Too many registration attempts from this IP, please try again in a minute.',
      details: {
        retryAfter: '60 seconds',
        maxRequests: 5,
        windowMs: 60000,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      },
    });
  },
});

/**
 * General authentication rate limiter for other auth routes
 * More lenient than registration rate limiter
 */
export const authRateLimiter = createRateLimiterWithFallback({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  storePrefix: 'rl:auth:', // Redis key prefix for general auth rate limiting

  message: {
    status: 'error',
    statusCode: 429,
    message:
      'Too many authentication attempts from this IP, please try again later.',
    details: {
      retryAfter: '15 minutes',
      maxRequests: 20,
      windowMs: 900000,
    },
  },

  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message:
        'Too many authentication attempts from this IP, please try again later.',
      details: {
        retryAfter: '15 minutes',
        maxRequests: 20,
        windowMs: 900000,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      },
    });
  },
});

export const generalRateLimiter = createRateLimiterWithFallback({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  storePrefix: 'rl:general:', // Redis key prefix for general rate limiting

  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many requests from this IP, please try again later.',
    details: {
      retryAfter: '15 minutes',
      maxRequests: 100,
      windowMs: 900000,
    },
  },

  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message: 'Too many requests from this IP, please try again later.',
      details: {
        retryAfter: '15 minutes',
        maxRequests: 100,
        windowMs: 900000,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      },
    });
  },
});

export const productRateLimiter = createRateLimiterWithFallback({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // 10 requests per 10 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  storePrefix: 'rl:product:', // Redis key prefix for product rate limiting

  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many product requests from this IP, please try again later.',
    details: {
      retryAfter: '10 minutes',
      maxRequests: 10,
      windowMs: 600000,
    },
  },

  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message:
        'Too many product requests from this IP, please try again later.',
      details: {
        retryAfter: '10 minutes',
        maxRequests: 10,
        windowMs: 600000,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      },
    });
  },
});

export default {
  registerRateLimiter,
  authRateLimiter,
  generalRateLimiter,
};
