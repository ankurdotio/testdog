import jwt from 'jsonwebtoken';
import gravatar from 'gravatar';
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
   * @param {Object} userData - { googleId?, username, email, password,name?, avatar? }
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
      googleId: userData.googleId || null, // Optional for Google users
      username: userData.username,
      email: userData.email,
      password: userData.password,
      name: userData.name || '',
      role: userData.role || 'user', // Default role
      avatar:
        userData.avatar ||
        gravatar.url(userData.email, { s: '100', r: 'x', d: 'retro' }, true),
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
  async getMe(userId, selectFields = '') {
    return await userDAO.findById(userId, selectFields);
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

  /**
   * Get a random user from the database.
   * @returns {Promise<Object|null>} - Random user or null if no users exist
   */
  async getRandomUser() {
    const user = await userDAO.getRandomUser();
    return user;
  }

  /**
   * Get all users with pagination.
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<Object>} - Paginated users with total count
   */

  async getAllUsersPaginated(page = 1, limit = 10) {
    const MAX_LIMIT = 50; // Increased from 5 to 50 for better usability
    let cappedMessage;

    page = parseInt(page);
    limit = parseInt(limit);

    if (limit > MAX_LIMIT) {
      cappedMessage = `Limit capped to ${MAX_LIMIT}. You requested ${limit}.`;
      limit = MAX_LIMIT;
    }

    const { data, total } = await userDAO.getAllUsersPaginated(page, limit);
    const totalPages = Math.ceil(total / limit);

    if (page > totalPages && total > 0) {
      throw new AppError(
        `Only ${totalPages} page(s) available. You requested page ${page}.`,
        400
      );
    }

    return {
      data,
      message: cappedMessage,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }
}

export default new UserService();
