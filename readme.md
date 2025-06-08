# Project: testdog

## Folder Structure

```
testdog/
├── .env
├── .prettierrc
├── eslint.config.js
├── logs/
├── package-lock.json
├── package.json
├── server.js
└── src/
    ├── app.js
    ├── config/
    │   ├── config.js
    │   ├── db.js
    │   ├── email.config.js
    │   ├── passport.js
    │   └── redis.js
    ├── constants/
    │   └── constants.js
    ├── controllers/
    │   ├── auth.controller.js
    │   └── user.controller.js
    ├── dao/
    │   └── user.dao.js
    ├── docs/
    │   └── validation.md
    ├── loggers/
    │   ├── morgan.logger.js
    │   └── winston.logger.js
    ├── middlewares/
    │   ├── auth.middleware.js
    │   ├── errorHandler.js
    │   └── validator.middleware.js
    ├── models/
    │   └── user.model.js
    ├── routes/
    │   ├── auth.routes.js
    │   └── user.routes.js
    ├── services/
    │   └── user.service.js
    ├── utils/
    │   ├── appError.js
    │   ├── asyncHandler.js
    │   ├── sendEmail.js
    │   └── timeUtils.js
    └── validators/
        ├── auth.validator.js
        ├── common.validator.js
        └── user.validator.js
```

## File Contents

### `.env`

```
PORT=3000
DB_URL=mongodb://localhost:27017/freeapi
JWT_SECRET=iske_alawa_kuch_bhi_puch_lo
GOOGLE_CLIENT_ID=1051463403503-ak2e7ugobu9ilc0ik19i84rikpeq7qhq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GMAIL_USER=ankurprajapati@sheryians.com
GOOGLE_REFRESH_TOKEN=1//04SkybLp7YKDQCgYIARAAGAQSNwF-L9IrnpCj4a-CINRKL0Nym1-P1KiNrmYNGo4Cnh7ZU8Fv8-UCU0oGtBOrr5qbWRTqeGRQjYw
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_USERNAME=
REDIS_DB=0
```

### `.prettierrc`

```
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5"
}
```

### `eslint.config.js`

```js
import eslintPluginImport from 'eslint-plugin-import';

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      import: eslintPluginImport,
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'import/order': [
        'warn',
        { groups: [['builtin', 'external', 'internal']] },
      ],
      'import/no-unresolved': 'error',
    },
  },
];
```

### `package-lock.json`

```json
*File content omitted: Exceeds 100 KB limit.*
```

### `package.json`

```json
{
  "name": "testdog",
  "version": "1.0.0",
  "description": "",
  "main": "server.js",
  "scripts": {
    "dev": "nodemon server.js",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "module",
  "dependencies": {
    "bcryptjs": "^3.0.2",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^5.1.0",
    "express-rate-limit": "^7.5.0",
    "express-validator": "^7.2.1",
    "googleapis": "^150.0.1",
    "helmet": "^8.1.0",
    "ioredis": "^5.6.1",
    "jsonwebtoken": "^9.0.2",
    "libphonenumber-js": "^1.12.9",
    "mongoose": "^8.15.1",
    "morgan": "^1.10.0",
    "nodemailer": "^7.0.3",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "winston": "^3.17.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.28.0",
    "eslint": "^9.28.0",
    "eslint-config-prettier": "^10.1.5",
    "eslint-plugin-import": "^2.31.0",
    "eslint-plugin-prettier": "^5.4.1",
    "globals": "^16.2.0",
    "nodemon": "^3.1.10",
    "prettier": "^3.5.3"
  }
}
```

### `server.js`

```js
import app from './src/app.js';
import config from './src/config/config.js';
import logger from './src/loggers/winston.logger.js';
import connectToDatabase from './src/config/db.js';
import redisService from './src/config/redis.js';

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Connect to database
connectToDatabase();

// Connect to Redis explicitly - this ensures a single connection
redisService.connect().then((connected) => {
  if (connected) {
    logger.info('Redis client successfully connected');
  } else {
    logger.warn('Failed to connect to Redis - check your configuration');
  }
});

// Start the server
const server = app.listen(config.PORT, () => {
  logger.info(`Server is running on port ${config.PORT}`);
  logger.debug(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Starting graceful shutdown...');

  // Close the server
  server.close(async () => {
    logger.info('HTTP server closed');

    // Disconnect from Redis
    await redisService.disconnect();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

### `src/app.js`

```js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import morganLogger from './loggers/morgan.logger.js';
import './config/passport.js'; // Ensure passport strategies are loaded
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// Middleware
app.use(cors());
app.use(morganLogger);
app.use(helmet());
app.use(
  express.json({
    limit: '100kb', // Limit JSON body size to 100KB
  })
);
app.use(express.urlencoded({ extended: true, limit: '100kb' })); // Limit URL-encoded body size to 100KB
app.use(cookieParser());
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);
app.use(passport.initialize());

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// // Simple route for checking server status
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the TestDog API',
    environment: config.NODE_ENV,
  });
});

// // 404 route handler for undefined routes
app.all('*name', (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.statusCode = 404;
  err.status = 'fail';
  next(err);
});

app.use(errorHandler);

export default app;
```

### `src/config/config.js`

```js
import dotenv from 'dotenv';

dotenv.config();

const _config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  DB_URL: process.env.DB_URL || 'mongodb://localhost:27017/mydatabase',
  JWT_SECRET: process.env.JWT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  GMAIL_USER: process.env.GMAIL_USER,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    username: process.env.REDIS_USERNAME || '',
    db: process.env.REDIS_DB || 0,
  },
};

export default Object.freeze(_config);
```

### `src/config/db.js`

```js
import mongoose from 'mongoose';
import config from './config.js';
import logger from '../loggers/winston.logger.js';

function connectToDatabase() {
  const dbURI = config.DB_URL;

  mongoose
    .connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      logger.info('Connected to MongoDB');
    })
    .catch((err) => {
      logger.error('Error connecting to MongoDB:', err);
    });
}

export default connectToDatabase;
```

### `src/config/email.config.js`

```js
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import config from './config.js';

const OAuth2 = google.auth.OAuth2;

const oAuth2Client = new OAuth2(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oAuth2Client.setCredentials({ refresh_token: config.GOOGLE_REFRESH_TOKEN });

export const createTransporter = async () => {
    const { token } = await oAuth2Client.getAccessToken();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: config.GMAIL_USER,
      clientId: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      refreshToken: config.GOOGLE_REFRESH_TOKEN,
      accessToken: token,
    },
  });
};
```

### `src/config/passport.js`

```js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model.js';
import config from './config.js';
import logger from '../loggers/winston.logger.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        logger.debug('Google profile:', JSON.stringify(profile));

        // Find user by googleId or email
        let user = await User.findOne({ googleId: profile.id });

        if (!user && profile.emails && profile.emails.length > 0) {
          // If not found by googleId, try to find by email
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // If found by email, link Google account
            user.googleId = profile.id;
            await user.save({ validateBeforeSave: false });
          }
        }

        if (!user) {
          // Create a new user if not found
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            avatar:
              profile.photos && profile.photos.length > 0
                ? profile.photos[0].value
                : undefined,
          });
          logger.info(`New user created via Google: ${user.email}`);
        }

        // Always update the Google access token
        if (accessToken) {
          user.googleAccessToken = accessToken;
          await user.save({ validateBeforeSave: false });
        }

        return done(null, user);
      } catch (err) {
        logger.error('Google authentication error:', err);
        return done(err, null);
      }
    }
  )
);
```

### `src/config/redis.js`

```js
import Redis from 'ioredis';
import config from './config.js';
import logger from '../loggers/winston.logger.js';

/**
 * Redis service class
 * Using ioredis package for Redis operations
 */
class RedisService {
  static #instance;

  /**
   * Get the singleton instance of RedisService
   * @param {Object} options - Redis connection options
   * @returns {RedisService} - The singleton instance
   */
  static getInstance(options = {}) {
    if (!RedisService.#instance) {
      RedisService.#instance = new RedisService(options);
    }
    return RedisService.#instance;
  }

  /**
   * Create a new RedisService instance (private constructor)
   * @param {Object} options - Redis connection options
   */
  constructor(options = {}) {
    // Prevent multiple instances
    if (RedisService.#instance) {
      return RedisService.#instance;
    }

    this.options = {
      host: options.host || config.redis?.host || '127.0.0.1',
      port: options.port || config.redis?.port || 6379,
      username: options.username || config.redis?.username || '',
      password: options.password || config.redis?.password || '',
      db: options.db || config.redis?.db || 0,
      onConnect: options.onConnect || (() => {}),
      onError:
        options.onError ||
        ((err) => logger.error(`Redis client error: ${err.message}`)),
    };

    this.client = null;
    RedisService.#instance = this;
  }

  /**
   * Initialize Redis client if not already initialized
   * @returns {Promise<boolean>} - True if successfully connected or already connected
   */
  async connect() {
    if (this.client && this.isConnected()) {
      logger.info('Redis already connected, reusing existing connection');
      return true;
    }

    try {
      // Create Redis instance
      this.client = new Redis({
        port: this.options.port,
        host: this.options.host,
        username: this.options.username,
        password: this.options.password,
        db: this.options.db,
        retryStrategy: (times) => {
          // Custom retry strategy
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      // Redis connection events
      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.options.onConnect();
      });

      this.client.on('error', (err) => {
        logger.error(`Redis client error: ${err.message}`);
        this.options.onError(err);
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting');
      });

      this.client.on('end', () => {
        logger.info('Redis client connection closed');
      });

      return true;
    } catch (err) {
      logger.error(`Redis initialization error: ${err.message}`);
      return false;
    }
  }

  /**
   * Get Redis connection status
   * @returns {boolean} - True if connected, false otherwise
   */
  isConnected() {
    return this.client && this.client.status === 'ready';
  }

  /**
   * Close Redis connection
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      logger.info('Redis connection closed gracefully');
    }
  }

  /**
   * Get a value from Redis
   * @param {string} key - Key to get value for
   * @returns {Promise<any>} - Promise resolving to the value or null if not found
   */
  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      logger.error(`Redis GET error for key ${key}: ${err.message}`);
      return null;
    }
  }

  /**
   * Set a value in Redis
   * @param {string} key - Key to set
   * @param {any} value - Value to store (will be stringified)
   * @param {number} [expiry] - Expiry time in seconds (optional)
   * @returns {Promise<boolean>} - Promise resolving to true if successful
   */
  async set(key, value, expiry = null) {
    try {
      const stringValue = JSON.stringify(value);
      if (expiry) {
        await this.client.set(key, stringValue, 'EX', expiry);
      } else {
        await this.client.set(key, stringValue);
      }
      return true;
    } catch (err) {
      logger.error(`Redis SET error for key ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Delete a key from Redis
   * @param {string} key - Key to delete
   * @returns {Promise<boolean>} - Promise resolving to true if successful
   */
  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (err) {
      logger.error(`Redis DEL error for key ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Check if a key exists in Redis
   * @param {string} key - Key to check
   * @returns {Promise<boolean>} - Promise resolving to true if key exists
   */
  async exists(key) {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (err) {
      logger.error(`Redis EXISTS error for key ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Set expiration time on a key
   * @param {string} key - Key to expire
   * @param {number} seconds - Seconds until expiration
   * @returns {Promise<boolean>} - Promise resolving to true if successful
   */
  async expire(key, seconds) {
    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (err) {
      logger.error(`Redis EXPIRE error for key ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Increment a key's value
   * @param {string} key - Key to increment
   * @returns {Promise<number|null>} - Promise resolving to the new value
   */
  async incr(key) {
    try {
      return await this.client.incr(key);
    } catch (err) {
      logger.error(`Redis INCR error for key ${key}: ${err.message}`);
      return null;
    }
  }

  /**
   * Set multiple hash fields to multiple values
   * @param {string} key - Hash key
   * @param {Object} fields - Object containing field-value pairs
   * @returns {Promise<boolean>} - Promise resolving to true if successful
   */
  async hmset(key, fields) {
    try {
      const args = [key];
      for (const [field, value] of Object.entries(fields)) {
        args.push(
          field,
          typeof value === 'object' ? JSON.stringify(value) : value
        );
      }
      await this.client.hmset(...args);
      return true;
    } catch (err) {
      logger.error(`Redis HMSET error for key ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Get all fields and values in a hash
   * @param {string} key - Hash key
   * @returns {Promise<Object|null>} - Promise resolving to an object with all field-value pairs
   */
  async hgetall(key) {
    try {
      return await this.client.hgetall(key);
    } catch (err) {
      logger.error(`Redis HGETALL error for key ${key}: ${err.message}`);
      return null;
    }
  }

  /**
   * Push a value to the end of a list
   * @param {string} key - List key
   * @param {any} value - Value to push
   * @returns {Promise<number|null>} - Promise resolving to the new length of the list
   */
  async rpush(key, value) {
    try {
      return await this.client.rpush(
        key,
        typeof value === 'object' ? JSON.stringify(value) : value
      );
    } catch (err) {
      logger.error(`Redis RPUSH error for key ${key}: ${err.message}`);
      return null;
    }
  }

  /**
   * Get a range of elements from a list
   * @param {string} key - List key
   * @param {number} start - Start index
   * @param {number} stop - Stop index
   * @returns {Promise<Array|null>} - Promise resolving to array of elements
   */
  async lrange(key, start, stop) {
    try {
      const result = await this.client.lrange(key, start, stop);
      return result.map((item) => {
        try {
          return JSON.parse(item);
        } catch {
          return item;
        }
      });
    } catch (err) {
      logger.error(`Redis LRANGE error for key ${key}: ${err.message}`);
      return null;
    }
  }
}

// Export the Redis service singleton instance (not connected yet)
const redisService = new RedisService();

export default redisService;
```

### `src/constants/constants.js`

```js
export const ACCESS_TOKEN_EXPIRATION = '1h';
export const REFRESH_TOKEN_EXPIRATION = '30d';
export const FORGOT_PASSWORD_TOKEN_EXPIRATION = '15m';
export const VERIFICATION_TOKEN_EXPIRATION = '10m';
```

### `src/controllers/auth.controller.js`

```js
import asyncHandler from '../utils/asyncHandler.js';
import config from '../config/config.js';
import userService from '../services/user.service.js';
import { sendVerificationEmail } from '../utils/sendEmail.js';
import redisService from '../config/redis.js';
import * as CONSTANTS from '../constants/constants.js';
import { timeStringToSeconds } from '../utils/timeUtils.js';

class AuthController {
  /**
   * Register a new user.
   * @param {Object} req - Express request object containing user data.
   * @param {Object} res - Express response object.
   */
  register = asyncHandler(async (req, res) => {
    const user = await userService.registerUser(req.body);
    const accessToken = userService.generateAccessToken({
      userId: user._id,
      username: user.username,
      email: user.email,
    });

    const refreshToken = await userService.generateRefreshToken({
      userId: user._id,
    });

    // Store refresh token in Redis
    const refreshExpirySecs = timeStringToSeconds(
      CONSTANTS.REFRESH_TOKEN_EXPIRATION
    );
    await redisService.set(
      `refreshToken:${user._id}`,
      refreshToken,
      refreshExpirySecs
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: 'none',
      maxAge: refreshExpirySecs * 1000, // Convert to milliseconds for cookie maxAge
    });

    const accessExpirySecs = timeStringToSeconds(
      CONSTANTS.ACCESS_TOKEN_EXPIRATION
    );
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: 'none',
      maxAge: accessExpirySecs * 1000, // Convert to milliseconds for cookie maxAge
    });

    res
      .status(201)
      .json({ success: true, data: user, accessToken, refreshToken });
  });

  /**
   * Login a user.
   * @param {Object} req - Express request object containing email and password.
   * @param {Object} res - Express response object.
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user } = await userService.loginUser(email, password);

    const accessToken = userService.generateAccessToken({
      userId: user._id,
      username: user.username,
      email: user.email,
    });

    const refreshToken = await userService.generateRefreshToken({
      userId: user._id,
    });

    // Store refresh token in Redis
    const refreshExpirySecs = timeStringToSeconds(
      CONSTANTS.REFRESH_TOKEN_EXPIRATION
    );
    await redisService.set(
      `refreshToken:${user._id}`,
      refreshToken,
      refreshExpirySecs
    );
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: 'none',
      maxAge: refreshExpirySecs * 1000, // Convert to milliseconds for cookie maxAge
    });

    const accessExpirySecs = timeStringToSeconds(
      CONSTANTS.ACCESS_TOKEN_EXPIRATION
    );
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: 'none',
      maxAge: accessExpirySecs * 1000, // Convert to milliseconds for cookie maxAge
    });

    res
      .status(200)
      .json({ success: true, data: user, accessToken, refreshToken });
  });

  /**
   * Get current logged-in user details.
   * @param {Object} req - Express request object with user ID in the token.
   * @param {Object} res - Express response object.
   */
  getMe = asyncHandler(async (req, res) => {
    const user = await userService.getMe(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  });

  /**
   * generate access token for user.
   * @param {Object} req - Express request object with user ID in the token.
   * @param {Object} res - Express response object.
   */
  generateAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: 'No refresh token provided' });
    }

    const user = await userService.verifyRefreshToken(refreshToken);

    const token = userService.generateAccessToken({
      userId: user._id,
      username: user.username,
      email: user.email,
    });

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({ success: true, accessToken: token });
  });

  /**
   * Handle the Google OAuth callback.
   * Creates and sets access and refresh tokens for the authenticated user.
   * @param {Object} req - Express request object with user from passport.
   * @param {Object} res - Express response object.
   */
  googleCallback = asyncHandler(async (req, res) => {
    // The user information is available in req.user thanks to passport
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
      });
    }

    // Generate tokens
    const accessToken = userService.generateAccessToken({
      userId: user._id,
      username: user.username || user.name, // Google might provide name instead of username
      email: user.email,
    });

    const refreshToken = await userService.generateRefreshToken({
      userId: user._id,
    });

    // Store refresh token in Redis
    const refreshExpirySecs = timeStringToSeconds(
      CONSTANTS.REFRESH_TOKEN_EXPIRATION
    );
    await redisService.set(
      `refreshToken:${user._id}`,
      refreshToken,
      refreshExpirySecs
    );

    // Set tokens in cookies
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production', // Secure in production
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production', // Secure in production
      sameSite: 'none',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user._id,
        name: user.name || user.username,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });
  });

  /**
   * Logout user by clearing cookies
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  logout = asyncHandler(async (req, res) => {
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    // Optionally, you can also invalidate the refresh token in the database or cache
    const userId = req.user._id;
    await redisService.del(`refreshToken:${userId}`);


    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  });

  /**
   * Verify user's email.
   * @param {Object} req - Express request object containing email.
   * @param {Object} res - Express response object.
   */
  verifyEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: 'Email is required' });
    }

    // Generate verification token
    const verificationToken = await userService.generateVerificationToken({
      email,
    });

    // Send verification email
    await sendVerificationEmail(
      email,
      `${config.NODE_ENV === 'production' ? 'https://testdog.in' : 'http://localhost:3000'}/api/v1/auth/verify-email?token=${verificationToken}`
    );

    res.status(200).json({
      success: true,
      message: 'Verification email sent',
    });
  });

  /**
   * Verify user's email using the token.
   * @param {Object} req - Express request object containing token.
   * @param {Object} res - Express response object.
   */
  verifyEmailToken = asyncHandler(async (req, res) => {
    const { token } = req.query;
    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: 'Token is required' });
    }

    const user = await userService.verifyEmail(token);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid or expired token' });
    }

    res
      .status(200)
      .json({ success: true, message: 'Email verified successfully', user });
  });
}

export default new AuthController();
```

### `src/controllers/user.controller.js`

```js
import config from '../config/config.js';
import userServices from '../services/user.service.js';
import asyncHandler from '../utils/asyncHandler.js';

class UserController {
  /**
   * Update user details.
   * @param {Object} req - Express request object with user ID in the token and updated data in body.
   * @param {Object} res - Express response object.
   */
  updateUser = asyncHandler(async (req, res) => {
    const user = await userServices.updateUser(req.user._id, req.body);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  });
}

export default new UserController();
```

### `src/dao/user.dao.js`

```js
import User from '../models/user.model.js';

/**
 * Data Access Object for User operations.
 * Handles all direct interactions with the User collection.
 */
class UserDAO {
  /**
   * Create a new user document in the database.
   * @param {Object} userData - Contains username, email, password, etc.
   * @returns {Promise<Object>} - Newly created user document.
   */
  async createUser(userData) {
    return await User.create(userData);
  }

  /**
   * Find a user by email. Useful during login or password reset.
   * @param {string} email - User's email address.
   * @returns {Promise<Object|null>} - Found user document or null.
   */
  async findByEmail(email) {
    return await User.findOne({ email }).select('+password');
  }

  /**
   * Find a user by ID.
   * @param {string} userId - MongoDB user ID.
   * @returns {Promise<Object|null>} - Found user document or null.
   */
  async findById(userId, selectFields = '') {
    return await User.findById(userId).select(selectFields);
  }

  /**
   * Find a user by username.
   * @param {string} username - User's unique username.
   * @returns {Promise<Object|null>} - Found user document or null.
   */
  async findByUsername(username, selectFields = '') {
    return await User.findOne({ username }).select(selectFields);
  }

  /**
   * Update user fields by ID.
   * @param {string} userId - MongoDB user ID.
   * @param {Object} updateData - Fields to update.
   * @returns {Promise<Object|null>} - Updated user document or null.
   */
  async updateUserById(userId, updateData) {
    return await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete a user by ID.
   * @param {string} userId - MongoDB user ID.
   * @returns {Promise<Object|null>} - Deleted user document or null.
   */
  async deleteUserById(userId) {
    return await User.findByIdAndDelete(userId);
  }
}

export default new UserDAO();
```

### `src/docs/validation.md`

```md
# Validation System Documentation

## Overview

This project uses `express-validator` for input validation at the routes level. The validation system ensures that all data coming into the API meets the expected format and constraints before being processed by controllers.

## Structure

- `src/validators/` - Contains validation schemas for different domains (auth, user, etc.)
- `src/middlewares/validator.middleware.js` - Contains the validation middleware and custom validators

## How to Use

### Basic Route Validation

```javascript
import { validate } from '../middlewares/validator.middleware.js';
import { loginValidator } from '../validators/auth.validator.js';

router.route('/login').post(validate(loginValidator), authController.login);
```

### Custom Validators

You can create custom validation rules in `validator.middleware.js` and use them in your validators:

```javascript
// In validator.middleware.js
export const customValidators = {
  isStrongPassword: (value) => {
    // Custom validation logic
    return passwordRegex.test(value);
  },
};

// In your validator file
body('password').custom((value) => {
  if (!customValidators.isStrongPassword(value)) {
    throw new Error('Password is not strong enough');
  }
  return true;
});
```

### Validation Error Handling

The validation middleware automatically formats errors and returns them in a consistent structure:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters"
  }
}
```

## Available Validators

- **Auth Validators**

  - `registerValidator` - Validates user registration data
  - `loginValidator` - Validates login credentials
  - `verifyEmailValidator` - Validates email verification requests
  - `verifyEmailTokenValidator` - Validates email verification tokens
  - `forgotPasswordValidator` - Validates forgot password requests
  - `resetPasswordValidator` - Validates password reset requests

- **User Validators**

  - `updateUserValidator` - Validates user profile updates

- **Common Validators**
  - `validateMongoId` - Validates MongoDB ObjectId parameters
  - `validateObjectId` - Customizable ObjectId validator for any parameter name

### Custom Validators

- **isStrongPassword** - Validates that a password meets complexity requirements
- **isValidPhone** - Validates international phone numbers using libphonenumber-js

### Usage Example for Phone Validation

```javascript
// With country code (more accurate)
body('phoneNumber').custom((value, { req }) => {
  if (!customValidators.isValidPhone(value, { req })) {
    throw new Error('Invalid phone number format');
  }
  return true;
});

// To improve validation accuracy, include a countryCode in your request
// Example form data: { phoneNumber: '9876543210', countryCode: 'US' }
```

## Best Practices

1. **Create domain-specific validators** - Keep validators organized by domain (auth, user, etc.)
2. **Use custom validators for complex rules** - Extract complex validation logic into custom validators
3. **Chain validators** - Use the middleware chaining pattern for cleaner route definitions
4. **Sanitize inputs** - Use `.trim()`, `.escape()`, and `.normalizeEmail()` to clean input data
```

### `src/loggers/morgan.logger.js`

```js
import morgan from 'morgan';
import logger from './winston.logger.js';

// Create a custom token format for the log
const format =
  ':remote-addr :method :url :status :res[content-length] - :response-time ms';

// Create Morgan middleware using Winston for logging
const morganLogger = morgan(format, {
  stream: logger.stream,
});

export default morganLogger;
```

### `src/loggers/winston.logger.js`

```js
import winston from 'winston';
import config from '../config/config.js';

// Define custom log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define different log level based on environment
const getLevel = () => {
  const env = config.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return 'info'; // Only logs info and above in production
    case 'testing':
      return 'warn'; // Only logs warn and above in testing
    default:
      return 'debug'; // Logs everything in development
  }
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'blue',
  http: 'white',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Define format for console logs with colors
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

// Create the logger with only console transport
const logger = winston.createLogger({
  level: 'debug',
  levels,
  transports: [
    // Console transport only
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
  // Don't exit on uncaught exceptions
  exitOnError: false,
});

// Create a stream object for morgan integration
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

export default logger;
```

### `src/middlewares/auth.middleware.js`

```js
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import AppError from '../utils/appError.js';
import config from '../config/config.js';
import userService from '../services/user.service.js';

/**
 * Middleware to protect routes that require authentication
 * Verifies the JWT token from the request headers or cookies
 */
export const protect = async (req, res, next) => {
  try {
    // 1) Get token from authorization header or cookies
    let token;

    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('You are not logged in. Please log in to get access.', 401)
      );
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, config.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await userService.getMe(decoded.id);

    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(
        new AppError('Your token has expired. Please log in again.', 401)
      );
    }
    next(error);
  }
};

/**
 * Middleware to restrict access based on user roles
 * @param  {...string} roles - Roles allowed to access the route
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array: ['admin', 'user']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};
```

### `src/middlewares/errorHandler.js`

```js
import AppError from '../utils/appError.js';
import logger from '../loggers/winston.logger.js';
import config from '../config/config.js';

/**
 * Global error handling middleware
 * Handles errors passed from controllers or thrown in the application
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let error = { ...err };
  error.message = err.message;

  // Set default values if not available
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  // Choose appropriate log level based on error type
  if (error.statusCode >= 500) {
    // 5xx errors are server errors and should be logged as errors
    logger.error('SERVER ERROR 💥', err);
  } else if (error.statusCode >= 400 && error.statusCode < 500) {
    // 4xx errors are client errors
    if (err.isOperational) {
      // Expected operational errors (like validation errors) use info level
      logger.info('CLIENT ERROR (Operational) 🔍', err);
    } else {
      // Unexpected client errors use warn level
      logger.warn('CLIENT ERROR 🚨', err);
    }
  } else {
    // Fallback for any other cases
    logger.error('UNHANDLED ERROR 💥', err);
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = new AppError(err.message, 400);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(
      `Duplicate field value: ${field}. Please use another value.`,
      400
    );
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}: ${err.value}.`, 400);
  }

  // Send error response
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    stack: config.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export default errorHandler;
```

### `src/middlewares/validator.middleware.js`

```js
import { validationResult } from 'express-validator';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Middleware to validate request data based on validation rules
 * @param {Array} validations - Array of express-validator validation rules
 * @returns {Function} Express middleware
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    // Execute all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check if there are validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format validation errors
    const extractedErrors = {};
    errors.array().forEach((err) => {
      // Group errors by field
      if (!extractedErrors[err.path]) {
        extractedErrors[err.path] = err.msg;
      }
    });

    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: extractedErrors,
    });
  };
};

/**
 * Helper function to check for specific validation rules
 * Can be expanded with more custom validators as needed
 */
export const customValidators = {
  isStrongPassword: (value) => {
    // Check for at least one uppercase, one lowercase, one number, and one special character
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:'",.<>\/\\])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{}|;:'",.<>\/\\]{8,}$/;
    return passwordRegex.test(value);
  },

  isValidPhone: (value, { req }) => {
    // Advanced phone number validation using libphonenumber-js
    try {
      // If country code is provided in the request, use it for better validation
      const countryCode = req?.body?.countryCode || req?.query?.countryCode;

      // If we have a country code, we can do more precise validation
      if (countryCode) {
        return isValidPhoneNumber(value, countryCode);
      }

      // Otherwise try to parse it as an international number
      const phoneNumber = parsePhoneNumber(value);
      return phoneNumber && phoneNumber.isValid();
    } catch (error) {
      // If parsing fails, it's not a valid number
      return false;
    }
  },
};
```

### `src/models/user.model.js`

```js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/config.js';
import * as CONSTANTS from '../constants/constants.js';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: function () {
        return !this.googleId;
      }, // Not required if using Google auth
      unique: true,
      sparse: true, // Allow multiple null values (for Google users without username)
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: function () {
        return !this.googleId; // Email verification not required for Google users
      },
      select: false, // Don't return this field by default
    },

    password: {
      type: String,
      required: function () {
        return !this.googleId;
      }, // Not required if using Google auth
      minlength: 6,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values (for non-Google users)
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      select: false,
    },
    avatar: {
      type: String,
      default: 'default.jpg',
    },
    forgotPasswordToken: {
      type: String,
      select: false,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },

    passwordChangedAt: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.isPasswordChangedAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);
export default User;
```

### `src/routes/auth.routes.js`

```js
import express from 'express';
import passport from 'passport';
import authController from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import {
  registerValidator,
  loginValidator,
  verifyEmailValidator,
  verifyEmailTokenValidator,
} from '../validators/auth.validator.js';

const router = express.Router();

// Authentication routes
router
  .route('/register')
  .post(validate(registerValidator), authController.register);
router.route('/login').post(validate(loginValidator), authController.login);
router.route('/logout').get(protect, authController.logout);

// User data routes
router.route('/getme').get(protect, authController.getMe);

// Token management routes
router.route('/access-token').get(authController.generateAccessToken);

// Email verification routes
router
  .route('/verify-email')
  .post(validate(verifyEmailValidator), authController.verifyEmail)
  .get(validate(verifyEmailTokenValidator), authController.verifyEmailToken);

// OAuth routes
router.route('/google').get(
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.route('/google/callback').get(
  passport.authenticate('google', {
    failureRedirect: '/login-failed', // Redirect to failure page if authentication fails
    session: false,
  }),
  authController.googleCallback
);

export default router;
```

### `src/routes/user.routes.js`

```js
import express from 'express';
import userController from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { updateUserValidator } from '../validators/user.validator.js';
import { validateObjectId } from '../validators/common.validator.js';

const router = express.Router();

// User routes
router
  .route('/update')
  .patch(protect, validate(updateUserValidator), userController.updateUser);

// Example of using the ID validator for future routes that need ID validation
// router.route('/:id')
//   .get(protect, validate(validateObjectId()), userController.getUserById)
//   .delete(protect, validate(validateObjectId()), userController.deleteUser);

export default router;
```

### `src/services/user.service.js`

```js
import jwt from 'jsonwebtoken';
import userDAO from '../dao/user.dao.js';
import AppError from '../utils/appError.js'; // Optional: custom error handler
import config from '../config/config.js';
import * as CONSTANT from '../constants/constants.js';
import redisService from '../config/redis.js';
import logger from '../loggers/winston.logger.js';

/**
 * Service class for handling user-related business logic.
 */
class UserService {
  /**
   * Register a new user after checking for existing email/username.
   * @param {Object} userData - { username, email, password }
   * @returns {Promise<Object>} - Newly created user (without password).
   */
  async registerUser(userData) {
    const existingEmail = await userDAO.findByEmail(userData.email);
    if (existingEmail) {
      throw new AppError('Email already registered.', 400);
    }

    const existingUsername = await userDAO.findByUsername(userData.username);
    if (existingUsername) {
      throw new AppError('Username already taken.', 400);
    }

    const newUser = await userDAO.createUser({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      name: userData.name || '',
    });
    newUser.password = undefined;
    return newUser;
  }

  /**
   * Login user by checking email and comparing password.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} - User and token if authenticated.
   */
  async loginUser(email, password) {
    const user = await userDAO.findByEmail(email);
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password.', 401);
    }

    user.password = undefined;

    return { user };
  }

  /**
   * Return current logged-in user details.
   * @param {string} userId - MongoDB user ID from token
   * @returns {Promise<Object|null>} - User details or null
   */
  async getMe(userId) {
    return await userDAO.findById(userId);
  }

  /**
   * Generate JWT token from user ID.
   * @param {string} userId
   * @returns {string} - JWT Token
   */
  generateAccessToken({ userId = null, username = null, email = null }) {
    return jwt.sign({ id: userId, username, email }, config.JWT_SECRET, {
      expiresIn: CONSTANT.ACCESS_TOKEN_EXPIRATION,
    });
  }

  /**
   * generate JWT refresh token.
   * @param {string} userId
   * @returns {string} - JWT Refresh Token
   */
  async generateRefreshToken({ userId = null }) {
    const token = jwt.sign({ id: userId }, config.JWT_SECRET, {
      expiresIn: CONSTANT.REFRESH_TOKEN_EXPIRATION,
    });

    return token;
  }

  /**
   * Check if a user exists with given email.
   * Useful for forgot-password flow.
   * @param {string} email
   * @returns {Promise<Object|null>} - Found user or null
   */
  async checkUserByEmail(email) {
    return await userDAO.findByEmail(email);
  }

  /**
   * Reset user password (after validating token externally).
   * @param {string} userId
   * @param {string} newPassword
   * @returns {Promise<Object>} - Updated user object
   */
  async resetPassword(userId, newPassword) {
    const user = await userDAO.findById(userId);
    if (!user) throw new AppError('User not found.', 404);

    user.password = newPassword;
    await user.save(); // triggers pre-save hashing
    return user;
  }

  /**
   * Update user details like username or email.
   * @param {string} userId - MongoDB user ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} - Updated user object
   */
  async updateUser(userId, updateData) {
    const user = await userDAO.findById(userId);
    if (!user) throw new AppError('User not found.', 404);

    // Prevent updating password directly
    if (updateData.password) {
      throw new AppError('Password cannot be updated directly.', 400);
    }

    // Update only allowed fields
    Object.keys(updateData).forEach((key) => {
      if (['username', 'email', 'name'].includes(key)) {
        user[key] = updateData[key];
      }
    });

    await user.save();
    user.password = undefined; // Exclude password from response
    return user;
  }

  /**
   * Verify Refresh Token and return user details.
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} - User object
   */
  async verifyRefreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.JWT_SECRET);
      if (!decoded || !decoded.id) {
        throw new AppError('Invalid refresh token.', 401);
      }

      const isTokenExists = await redisService.get(
        `refreshToken:${decoded.id}`
      );

      if (!isTokenExists) {
        throw new AppError('Refresh token not found.', 401);
      }

      // Check if user exists and token matches
      if (refreshToken !== isTokenExists) {
        throw new AppError('Invalid refresh token.', 401);
      }

      const user = await userDAO.findById(decoded.id);
      if (!user) {
        throw new AppError('Invalid refresh token.', 401);
      }
      return user;
    } catch (err) {
      // Log the original error details to aid debugging
      logger.warn('Refresh token verification failed', {
        error: err.message,
        stack: err.stack,
        tokenId: err.decoded?.id || 'unknown',
      });

      // Throw a more detailed AppError that preserves error info
      throw new AppError('Invalid or expired refresh token.', 401);
    }
  }

  /**
   * Generate user verification token by ID.
   * @param {string} userId - MongoDB user ID
   * @returns {Promise<Object>} - Verification token
   */
  async generateVerificationToken({ email }) {
    const user = await userDAO.findByEmail(email);
    if (!user) throw new AppError('User not found.', 404);

    const verificationToken = jwt.sign({ id: user._id }, config.JWT_SECRET, {
      expiresIn: CONSTANT.VERIFICATION_TOKEN_EXPIRATION,
    });

    user.emailVerificationToken = verificationToken;
    await user.save();

    return verificationToken;
  }

  /**
   * Verify user email using verification token.
   * @param {string} token - Verification token
   * @returns {Promise<Object>} - Verified user object
   */
  async verifyEmail(token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);

      if (!decoded || !decoded.id) {
        throw new AppError('Invalid verification token.', 401);
      }

      const user = await userDAO.findById(
        decoded.id,
        '+emailVerificationToken'
      );
      if (!user || user.emailVerificationToken !== token) {
        throw new AppError('Invalid verification token.', 401);
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined; // Clear token after verification
      await user.save();

      return user;
    } catch (err) {
      // Log the original error details to aid debugging
      logger.warn('Email verification failed', {
        error: err.message,
        stack: err.stack,
        userId: err.decoded?.id || 'unknown',
        tokenFragment: token ? `${token.substring(0, 8)}...` : 'undefined',
      });

      // Throw a more descriptive AppError while preserving error context
      throw new AppError('Invalid or expired verification token.', 401);
    }
  }
}

export default new UserService();
```

### `src/utils/appError.js`

```js
/**
 * Custom AppError class to standardize error handling.
 * Can be thrown anywhere in the code to trigger error middleware.
 */
class AppError extends Error {
  /**
   * Create an operational error instance.
   * @param {string} message - Error message to show to client.
   * @param {number} statusCode - HTTP status code (e.g., 400, 404).
   */
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Capture stack trace excluding constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
```

### `src/utils/asyncHandler.js`

```js
/**
 * Async handler wrapper to avoid try-catch blocks in route controllers
 * Uses promise chaining with .then() and .catch() as requested
 *
 * @param {Function} fn - The async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    next(error); // Pass any errors to Express error handling middleware
  });
};

export default asyncHandler;
```

### `src/utils/sendEmail.js`

```js
import { createTransporter } from '../config/email.config.js';
import config from '../config/config.js';

export const sendVerificationEmail = async (to, verificationLink) => {
  const transporter = await createTransporter();
  const mailOptions = {
    from: `"Testdog" <${config.GMAIL_USER}>`,
    to,
    subject: 'Verify your email',
    html: `
      <p>Click the link below to verify your email:</p>
      <a href="${verificationLink}">${verificationLink}</a>
    `,
  };

  return transporter.sendMail(mailOptions);
};
```

### `src/utils/timeUtils.js`

```js
/**
 * Convert a time string like '30d', '1h', '15m' to seconds
 * @param {string} timeString - Time string in format like '30d', '1h', '15m'
 * @returns {number} - Time in seconds
 */
export function timeStringToSeconds(timeString) {
  const regex = /^(\d+)([dhms])$/;
  const match = timeString.match(regex);

  if (!match) {
    throw new Error(
      `Invalid time format: ${timeString}. Expected format like '30d', '1h', '15m', '30s'`
    );
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60; // days to seconds
    case 'h':
      return value * 60 * 60; // hours to seconds
    case 'm':
      return value * 60; // minutes to seconds
    case 's':
      return value; // seconds
    default:
      return value;
  }
}
```

### `src/validators/auth.validator.js`

```js
import { body, query, param } from 'express-validator';
import { customValidators } from '../middlewares/validator.middleware.js';

export const registerValidator = [
  body('username')
    .optional({ nullable: true })
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .trim()
    .escape(),
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .trim(),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .custom((value) => {
      if (!customValidators.isStrongPassword(value)) {
        throw new Error(
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        );
      }
      return true;
    }),
];

export const loginValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

export const verifyEmailValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
];

export const verifyEmailTokenValidator = [
  query('token').notEmpty().withMessage('Token is required'),
];

export const forgotPasswordValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
];

export const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Token is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .custom((value) => {
      if (!customValidators.isStrongPassword(value)) {
        throw new Error(
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        );
      }
      return true;
    }),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];
```

### `src/validators/common.validator.js`

```js
import { param } from 'express-validator';
import mongoose from 'mongoose';

export const validateMongoId = [
  param('id')
    .notEmpty()
    .withMessage('ID parameter is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid ID format');
      }
      return true;
    }),
];

export const validateObjectId = (idField = 'id') => [
  param(idField)
    .notEmpty()
    .withMessage(`${idField} parameter is required`)
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(`Invalid ${idField} format`);
      }
      return true;
    }),
];
```

### `src/validators/user.validator.js`

```js
import { body } from 'express-validator';
import { customValidators } from '../middlewares/validator.middleware.js';

export const updateUserValidator = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .trim()
    .escape(),
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
    .trim(),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .custom((value) => {
      if (value && !customValidators.isStrongPassword(value)) {
        throw new Error(
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        );
      }
      return true;
    }),
];
```

