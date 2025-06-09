import express from 'express';
import userController from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { updateUserValidator } from '../validators/user.validator.js';

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
