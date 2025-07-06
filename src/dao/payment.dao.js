import Payment from '../models/payment.model.js';
import AppError from '../utils/appError.js';

class PaymentDAO {
  // Create a new payment
  async create(paymentData) {
    try {
      const payment = new Payment(paymentData);
      return await payment.save();
    } catch (error) {
      throw new AppError(`Failed to create payment: ${error.message}`, 500);
    }
  }

  // Find payment by ID
  async findById(paymentId, populate = false) {
    try {
      let query = Payment.findById(paymentId);

      if (populate) {
        query = query
          .populate('user', 'name email')
          .populate('cartItems.product', 'product_name main_image final_price')
          .populate(
            'singleProduct.product',
            'product_name main_image final_price'
          );
      }

      return await query;
    } catch (error) {
      // Handle MongoDB CastError (invalid ObjectId format)
      if (error.name === 'CastError' || error.name === 'BSONError') {
        throw new AppError('Invalid payment ID format', 400);
      }
      throw new AppError(`Failed to find payment: ${error.message}`, 500);
    }
  }

  // Find payment by order ID
  async findByOrderId(orderId) {
    try {
      return await Payment.findOne({ orderId });
    } catch (error) {
      throw new AppError(
        `Failed to find payment by order ID: ${error.message}`,
        500
      );
    }
  }

  // Find payment by Razorpay order ID
  async findByRazorpayOrderId(razorpayOrderId) {
    try {
      return await Payment.findOne({ razorpayOrderId });
    } catch (error) {
      throw new AppError(
        `Failed to find payment by Razorpay order ID: ${error.message}`,
        500
      );
    }
  }

  // Find payment by Razorpay payment ID
  async findByRazorpayPaymentId(razorpayPaymentId) {
    try {
      return await Payment.findOne({ razorpayPaymentId });
    } catch (error) {
      throw new AppError(
        `Failed to find payment by Razorpay payment ID: ${error.message}`,
        500
      );
    }
  }

  // Get user payments with pagination
  async getUserPayments(userId, options = {}) {
    try {
      const {
        status,
        orderType,
        page = 1,
        limit = 10,
        sort = { createdAt: -1 },
      } = options;

      const skip = (page - 1) * limit;
      const query = { user: userId };

      if (status) query.status = status;
      if (orderType) query.orderType = orderType;

      const payments = await Payment.find(query)
        .populate('cartItems.product', 'product_name main_image final_price')
        .populate(
          'singleProduct.product',
          'product_name main_image final_price'
        )
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const totalCount = await Payment.countDocuments(query);

      return {
        payments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new AppError(`Failed to get user payments: ${error.message}`, 500);
    }
  }

  // Update payment status
  async updateStatus(paymentId, status, additionalData = {}) {
    try {
      const updateData = { status, ...additionalData };

      if (status === 'paid') {
        updateData.paidAt = new Date();
      } else if (status === 'failed') {
        updateData.failedAt = new Date();
      }

      return await Payment.findByIdAndUpdate(paymentId, updateData, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      throw new AppError(
        `Failed to update payment status: ${error.message}`,
        500
      );
    }
  }

  // Update payment with Razorpay payment details
  async updateWithPaymentDetails(
    paymentId,
    razorpayPaymentId,
    razorpaySignature,
    paymentMethod
  ) {
    try {
      return await Payment.findByIdAndUpdate(
        paymentId,
        {
          razorpayPaymentId,
          razorpaySignature,
          paymentMethod,
          status: 'paid',
          paidAt: new Date(),
        },
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw new AppError(
        `Failed to update payment details: ${error.message}`,
        500
      );
    }
  }

  // Add refund information
  async addRefundInfo(paymentId, refundData) {
    try {
      return await Payment.findByIdAndUpdate(
        paymentId,
        {
          status: 'refunded',
          refundInfo: {
            refundId: refundData.refundId,
            refundAmount: refundData.amount,
            refundReason: refundData.reason,
            refundedAt: new Date(),
          },
        },
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw new AppError(`Failed to add refund info: ${error.message}`, 500);
    }
  }

  // Get payments by status
  async getPaymentsByStatus(status, options = {}) {
    try {
      const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
      const skip = (page - 1) * limit;

      const payments = await Payment.find({ status })
        .populate('user', 'name email')
        .populate('cartItems.product', 'product_name main_image final_price')
        .populate(
          'singleProduct.product',
          'product_name main_image final_price'
        )
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const totalCount = await Payment.countDocuments({ status });

      return {
        payments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new AppError(
        `Failed to get payments by status: ${error.message}`,
        500
      );
    }
  }

  // Get payment statistics
  async getPaymentStats(dateFilter = {}) {
    try {
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
            pendingPayments: {
              $sum: {
                $cond: [{ $in: ['$status', ['created', 'attempted']] }, 1, 0],
              },
            },
            averageAmount: { $avg: '$amount' },
          },
        },
        {
          $addFields: {
            successRate: {
              $cond: [
                { $eq: ['$totalPayments', 0] },
                0,
                {
                  $multiply: [
                    { $divide: ['$successfulPayments', '$totalPayments'] },
                    100,
                  ],
                },
              ],
            },
            totalAmountFormatted: { $divide: ['$totalAmount', 100] },
            averageAmountFormatted: { $divide: ['$averageAmount', 100] },
          },
        },
      ]);

      return (
        stats[0] || {
          totalPayments: 0,
          totalAmount: 0,
          successfulPayments: 0,
          failedPayments: 0,
          refundedPayments: 0,
          pendingPayments: 0,
          averageAmount: 0,
          successRate: 0,
          totalAmountFormatted: 0,
          averageAmountFormatted: 0,
        }
      );
    } catch (error) {
      throw new AppError(
        `Failed to get payment statistics: ${error.message}`,
        500
      );
    }
  }

  // Get payment method breakdown
  async getPaymentMethodStats(dateFilter = {}) {
    try {
      const matchStage = { status: 'paid' };
      if (Object.keys(dateFilter).length > 0) {
        matchStage.createdAt = dateFilter;
      }

      return await Payment.aggregate([
        { $match: matchStage },
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
        { $sort: { count: -1 } },
      ]);
    } catch (error) {
      throw new AppError(
        `Failed to get payment method stats: ${error.message}`,
        500
      );
    }
  }

  // Get order type breakdown
  async getOrderTypeStats(dateFilter = {}) {
    try {
      const matchStage = {};
      if (Object.keys(dateFilter).length > 0) {
        matchStage.createdAt = dateFilter;
      }

      return await Payment.aggregate([
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
        { $sort: { count: -1 } },
      ]);
    } catch (error) {
      throw new AppError(
        `Failed to get order type stats: ${error.message}`,
        500
      );
    }
  }

  // Delete payment (soft delete by marking as cancelled)
  async delete(paymentId) {
    try {
      return await Payment.findByIdAndUpdate(
        paymentId,
        { status: 'cancelled' },
        { new: true }
      );
    } catch (error) {
      throw new AppError(`Failed to delete payment: ${error.message}`, 500);
    }
  }

  // Hard delete payment (use with caution)
  async hardDelete(paymentId) {
    try {
      return await Payment.findByIdAndDelete(paymentId);
    } catch (error) {
      throw new AppError(
        `Failed to hard delete payment: ${error.message}`,
        500
      );
    }
  }
}

export default new PaymentDAO();
