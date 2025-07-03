import express from 'express';
import cartController from '../controllers/cart.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import {
  addToCartValidator,
  updateCartItemValidator,
  removeCartItemValidator,
} from '../validators/cart.validator.js';

const router = express.Router();

// All cart routes require authentication
router.use(protect);

// Cart summary - Get quick overview of cart
router.route('/summary').get(cartController.getCartSummary);

// Main cart routes
router
  .route('/')
  .get(cartController.getCart) // Get cart items
  .post(validate(addToCartValidator), cartController.addToCart) // Add product to cart
  .delete(cartController.clearCart); // Clear entire cart

// Cart item specific routes
router
  .route('/:id')
  .patch(validate(updateCartItemValidator), cartController.updateCartItem) // Update item quantity
  .delete(validate(removeCartItemValidator), cartController.removeCartItem); // Remove item from cart

export default router;
