import express from 'express';
import userController from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { getAllUsersValidator, updateUserValidator } from '../validators/user.validator.js';

const router = express.Router();

// User routes
router
  .route('/update')
  .patch(protect, validate(updateUserValidator), userController.updateUser);

router.route('/getrandomuser').get(userController.getRandomUser);

router.route('/all').get(validate(getAllUsersValidator), userController.getAllUsers);


export default router;
