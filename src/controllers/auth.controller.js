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
