import { body, query, param, validationResult } from 'express-validator';
import AppError from '../utils/appError.js';

// Validation middleware to handle errors
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    throw new AppError(errorMessages.join(', '), 400);
  }
  next();
};

// Validate shipping address
const shippingAddressValidator = [
  body('shippingAddress.fullName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('shippingAddress.address')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('shippingAddress.city')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('shippingAddress.state')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  body('shippingAddress.zipCode')
    .optional()
    .matches(/^[0-9]{5,10}$/)
    .withMessage('ZIP code must be 5-10 digits'),
  body('shippingAddress.country')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters'),
  body('shippingAddress.phone')
    .optional()
    .matches(/^[+]?[1-9]\d{1,14}$/)
    .withMessage('Phone number must be valid'),
];

// Create cart order validation
export const createCartOrderValidator = [
  ...shippingAddressValidator,
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
];

// Create single product order validation
export const createSingleProductOrderValidator = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Product ID must be a valid MongoDB ObjectId'),
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Quantity must be between 1 and 50'),
  body('selectedSize')
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage('Selected size must be between 1 and 10 characters'),
  body('selectedColor')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('Selected color must be between 1 and 20 characters'),
  ...shippingAddressValidator,
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
];

// Verify payment validation
export const verifyPaymentValidator = [
  body('razorpay_order_id')
    .notEmpty()
    .withMessage('Razorpay order ID is required')
    .isLength({ min: 1 })
    .withMessage('Razorpay order ID cannot be empty'),
  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Razorpay payment ID is required')
    .isLength({ min: 1 })
    .withMessage('Razorpay payment ID cannot be empty'),
  body('razorpay_signature')
    .notEmpty()
    .withMessage('Razorpay signature is required')
    .isLength({ min: 1 })
    .withMessage('Razorpay signature cannot be empty'),
];

// Get payment history validation
export const getPaymentHistoryValidator = [
  query('status')
    .optional()
    .isIn(['created', 'attempted', 'paid', 'failed', 'cancelled', 'refunded'])
    .withMessage(
      'Status must be one of: created, attempted, paid, failed, cancelled, refunded'
    ),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Request refund validation
export const requestRefundValidator = [
  param('paymentId')
    .notEmpty()
    .withMessage('Payment ID is required')
    .isMongoId()
    .withMessage('Payment ID must be a valid MongoDB ObjectId'),
  body('refundAmount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be greater than 0.01'),
  body('reason')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Reason must be between 1 and 200 characters'),
];

// Get payment details validation
export const getPaymentDetailsValidator = [
  param('paymentId')
    .notEmpty()
    .withMessage('Payment ID is required')
    .isMongoId()
    .withMessage('Payment ID must be a valid MongoDB ObjectId'),
];

// Get payment stats validation (admin only)
export const getPaymentStatsValidator = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
];
