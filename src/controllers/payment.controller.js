import asyncHandler from '../utils/asyncHandler.js';
import paymentService from '../services/payment.service.js';
import AppError from '../utils/appError.js';
import Payment from '../models/payment.model.js';

// Create order for cart payment
export const createCartOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { shippingAddress, notes } = req.body;

  const orderData = await paymentService.createCartOrder(
    userId,
    shippingAddress,
    notes
  );

  res.status(201).json({
    status: 'success',
    message: 'Cart order created successfully',
    data: orderData,
  });
});

// Create order for single product payment
export const createSingleProductOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    productId,
    quantity,
    selectedSize,
    selectedColor,
    shippingAddress,
    notes,
  } = req.body;

  if (!productId) {
    throw new AppError('Product ID is required', 400);
  }

  const orderData = await paymentService.createSingleProductOrder(
    userId,
    productId,
    quantity || 1,
    selectedSize,
    selectedColor,
    shippingAddress,
    notes
  );

  res.status(201).json({
    status: 'success',
    message: 'Single product order created successfully',
    data: orderData,
  });
});

// Verify payment
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError('Missing payment verification data', 400);
  }

  const verificationResult = await paymentService.verifyPayment(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  res.status(200).json({
    status: 'success',
    message: 'Payment verified successfully',
    data: verificationResult,
  });
});

// Get payment details
export const getPaymentDetails = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  if (!paymentId) {
    throw new AppError('Payment ID is required', 400);
  }

  const payment = await paymentService.getPaymentDetails(paymentId);

  // Check if user owns this payment
  if (payment.user._id.toString() !== req.user.id) {
    throw new AppError('Access denied', 403);
  }

  res.status(200).json({
    status: 'success',
    data: { payment },
  });
});

// Get user payment history
export const getPaymentHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 10 } = req.query;

  const result = await paymentService.getUserPaymentHistory(
    userId,
    status,
    parseInt(page),
    parseInt(limit)
  );

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// Request refund (Admin only or specific conditions)
export const requestRefund = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { refundAmount, reason } = req.body;

  if (!paymentId) {
    throw new AppError('Payment ID is required', 400);
  }

  // Get payment to check ownership
  const payment = await paymentService.getPaymentDetails(paymentId);

  // Check if user owns this payment or is admin
  if (
    payment.user._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    throw new AppError('Access denied', 403);
  }

  const refundResult = await paymentService.refundPayment(
    paymentId,
    refundAmount,
    reason
  );

  res.status(200).json({
    status: 'success',
    message: 'Refund processed successfully',
    data: refundResult,
  });
});

// Handle Razorpay webhooks
export const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const payload = req.body;

  if (!signature) {
    throw new AppError('Missing webhook signature', 400);
  }

  const result = await paymentService.handleWebhook(signature, payload);

  res.status(200).json({
    status: 'success',
    message: 'Webhook processed successfully',
    data: result,
  });
});

// Get payment statistics (Admin only)
export const getPaymentStats = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Access denied', 403);
  }

  const { startDate, endDate } = req.query;

  // Build date filter
  const dateFilter = {};

  // Add start date filter if provided
  if (startDate && startDate.trim() !== '') {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      throw new AppError('Invalid start date format', 400);
    }
    dateFilter.$gte = start;
  }

  // Add end date filter if provided
  if (endDate && endDate.trim() !== '') {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      throw new AppError('Invalid end date format', 400);
    }
    dateFilter.$lte = end;
  }

  // Build match stage for aggregation
  const matchStage = {};
  if (Object.keys(dateFilter).length > 0) {
    matchStage.createdAt = dateFilter;
  }

  const stats = await Payment.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        successfulPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] },
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
        },
        refundedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] },
        },
        averageAmount: { $avg: '$amount' },
      },
    },
    {
      $addFields: {
        successRate: {
          $multiply: [
            { $divide: ['$successfulPayments', '$totalPayments'] },
            100,
          ],
        },
        totalAmountFormatted: { $divide: ['$totalAmount', 100] },
        averageAmountFormatted: { $divide: ['$averageAmount', 100] },
      },
    },
  ]);

  // Get payment method breakdown
  const methodStats = await Payment.aggregate([
    { $match: { status: 'paid', ...matchStage } },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        amount: { $sum: '$amount' },
      },
    },
    {
      $addFields: {
        amountFormatted: { $divide: ['$amount', 100] },
      },
    },
  ]);

  // Get order type breakdown
  const orderTypeStats = await Payment.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$orderType',
        count: { $sum: 1 },
        amount: { $sum: '$amount' },
      },
    },
    {
      $addFields: {
        amountFormatted: { $divide: ['$amount', 100] },
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      overview: stats[0] || {
        totalPayments: 0,
        totalAmount: 0,
        successfulPayments: 0,
        failedPayments: 0,
        refundedPayments: 0,
        averageAmount: 0,
        successRate: 0,
        totalAmountFormatted: 0,
        averageAmountFormatted: 0,
      },
      paymentMethods: methodStats,
      orderTypes: orderTypeStats,
    },
  });
});

export default {
  createCartOrder,
  createSingleProductOrder,
  verifyPayment,
  getPaymentDetails,
  getPaymentHistory,
  requestRefund,
  handleWebhook,
  getPaymentStats,
};
