import express from 'express';
import paymentController from '../controllers/payment.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import {
  createCartOrderValidator,
  createSingleProductOrderValidator,
  verifyPaymentValidator,
  getPaymentHistoryValidator,
  requestRefundValidator,
  getPaymentStatsValidator,
  getPaymentDetailsValidator,
  validate,
} from '../validators/payment.validator.js';

const router = express.Router();

// Webhook endpoint (no auth required)
router.post('/webhook', paymentController.handleWebhook);

// Protected routes - require authentication
router.use(protect);

// Create orders
router.post(
  '/orders/cart',
  createCartOrderValidator,
  validate,
  paymentController.createCartOrder
);

router.post(
  '/orders/single-product',
  createSingleProductOrderValidator,
  validate,
  paymentController.createSingleProductOrder
);

// Verify payment
router.post(
  '/verify',
  verifyPaymentValidator,
  validate,
  paymentController.verifyPayment
);

// Get payment details
router.get(
  '/details/:paymentId',
  getPaymentDetailsValidator,
  validate,
  paymentController.getPaymentDetails
);

// Get payment history
router.get(
  '/history',
  getPaymentHistoryValidator,
  validate,
  paymentController.getPaymentHistory
);

// Request refund
router.post(
  '/refund/:paymentId',
  requestRefundValidator,
  validate,
  paymentController.requestRefund
);

// Admin only routes
router.get(
  '/stats',
  getPaymentStatsValidator,
  validate,
  paymentController.getPaymentStats
);

export default router;
