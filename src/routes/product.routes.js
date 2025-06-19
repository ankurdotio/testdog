import express from 'express';
import productController from '../controllers/product.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { createProductValidator } from '../validators/product.validator.js';
import { generalRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = express.Router();

// Apply rate limiting to all product routes
router.use(generalRateLimiter);

// Public routes - no authentication required
router.route('/search').get(productController.searchProducts);
router.route('/autocomplete').get(productController.getAutocomplete);
router.route('/random').get(productController.getRandomProduct);

// Get all products (with pagination) - Public
router.route('/').get(productController.getAllProducts);

// Get specific product by ID - Public
router.route('/:id').get(productController.getProduct);

// Protected routes - authentication required
// Create product - Only authenticated admins
router.route('/').post(
  protect, // Authentication middleware
  restrictTo('admin'), // Only admins can create products
  validate(createProductValidator), // Validation middleware
  productController.createProduct
);

export default router;
