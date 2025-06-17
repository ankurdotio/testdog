import express from 'express';
import passport from 'passport';
import authController from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import {
  registerRateLimiter,
  authRateLimiter,
} from '../middlewares/rateLimiter.middleware.js';
import {
  registerValidator,
  loginValidator,
  verifyEmailValidator,
  verifyEmailTokenValidator,
} from '../validators/auth.validator.js';

const router = express.Router();

router.use(authRateLimiter); // Apply general auth rate limiting to all routes

// Authentication routes
router
  .route('/register')
  .post(
    registerRateLimiter,
    validate(registerValidator),
    authController.register
  );
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
