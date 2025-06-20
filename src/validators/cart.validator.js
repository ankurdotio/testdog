import { body, param } from 'express-validator';
import mongoose from 'mongoose';

export const addToCartValidator = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid product ID format');
      }
      return true;
    }),

  body('quantity')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Quantity must be between 1 and 50')
    .toInt(),

  body('selectedSize')
    .optional()
    .isString()
    .withMessage('Selected size must be a string')
    .isLength({ min: 1, max: 20 })
    .withMessage('Selected size must be between 1 and 20 characters')
    .trim(),

  body('selectedColor')
    .optional()
    .isString()
    .withMessage('Selected color must be a string')
    .isLength({ min: 1, max: 50 })
    .withMessage('Selected color must be between 1 and 50 characters')
    .trim(),
];

export const updateCartItemValidator = [
  param('id')
    .notEmpty()
    .withMessage('Cart item ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid cart item ID format');
      }
      return true;
    }),

  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1, max: 50 })
    .withMessage('Quantity must be between 1 and 50')
    .toInt(),
];

export const removeCartItemValidator = [
  param('id')
    .notEmpty()
    .withMessage('Cart item ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid cart item ID format');
      }
      return true;
    }),
];
