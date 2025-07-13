import express from 'express';
import userController from '../controllers/user.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import {
  getAllUsersValidator,
  updateUserValidator,
} from '../validators/user.validator.js';
import { userRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = express.Router();

// Apply rate limiting to all user routes
router.use(userRateLimiter);

// User routes
router
  .route('/update')
  .patch(protect, validate(updateUserValidator), userController.updateUser);

router.route('/getrandomuser').get(userController.getRandomUser);

// Protected route - only admins should be able to get all users
router
  .route('/all')
  .get(
    protect,
    restrictTo('admin'),
    validate(getAllUsersValidator),
    userController.getAllUsers
  );

export default router;
