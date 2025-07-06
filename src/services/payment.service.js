import Razorpay from 'razorpay';
import crypto from 'crypto';
import config from '../config/config.js';
import paymentDAO from '../dao/payment.dao.js';
import productDAO from '../dao/product.dao.js';
import cartDAO from '../dao/cart.dao.js';
import AppError from '../utils/appError.js';
import logger from '../loggers/winston.logger.js';
import { convertCurrency } from '../utils/currencyUtils.js';

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }

  // Generate unique order ID
  generateOrderId() {
    return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create order for cart payment
  async createCartOrder(userId, shippingAddress = null, notes = '') {
    try {
      // Get user's cart using DAO
      const cart = await cartDAO.findCartByUserId(userId);

      if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
      }

      // Check if all products are in stock
      const outOfStockItems = cart.items.filter(
        (item) => !item.product.in_stock
      );
      if (outOfStockItems.length > 0) {
        throw new AppError('Some items in cart are out of stock', 400);
      }

      // Calculate total amount in INR (convert from product currencies)
      let totalAmountINR = 0;
      cart.items.forEach((item) => {
        // Convert item price to INR if it's in a different currency
        const priceInINR = convertCurrency(
          item.price,
          item.product.currency,
          'INR'
        );

        const itemTotalINR = priceInINR * item.quantity;
        totalAmountINR += itemTotalINR;
      });

      // Convert to paise (smallest currency unit for INR)
      const totalAmount = Math.round(totalAmountINR * 100);

      // Create Razorpay order
      const razorpayOrder = await this.razorpay.orders.create({
        amount: totalAmount,
        currency: 'INR',
        receipt: this.generateOrderId(),
        notes: {
          user_id: userId.toString(),
          order_type: 'cart',
          notes: notes || '',
        },
      });

      // Prepare cart items for payment record
      const cartItems = cart.items.map((item) => {
        const priceInINR =
          item.product.currency === 'INR'
            ? item.price
            : convertCurrency(item.price, item.product.currency, 'INR');

        return {
          product: item.product._id,
          quantity: item.quantity,
          price: item.price,
          priceInINR: priceInINR,
          originalCurrency: item.product.currency,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
        };
      });

      // Create payment record using DAO
      const payment = await paymentDAO.create({
        user: userId,
        orderId: razorpayOrder.receipt,
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        currency: 'INR',
        status: 'created',
        orderType: 'cart',
        cartItems,
        shippingAddress,
        notes,
      });

      return {
        success: true,
        orderId: razorpayOrder.id,
        amount: totalAmount,
        currency: 'INR',
        receipt: razorpayOrder.receipt,
        paymentId: payment._id,
        cartSummary: {
          totalItems: cart.totalItems,
          totalAmount: totalAmountINR, // Use converted INR amount
          totalAmountINR: totalAmountINR,
          items: cart.items.map((item) => {
            // Convert item price to INR for display
            const priceInINR =
              item.product.currency === 'INR'
                ? item.price
                : convertCurrency(item.price, item.product.currency, 'INR');

            return {
              productName: item.product.product_name,
              quantity: item.quantity,
              price: item.price, // Original price
              priceInINR: priceInINR, // Converted price
              originalCurrency: item.product.currency,
              selectedSize: item.selectedSize,
              selectedColor: item.selectedColor,
            };
          }),
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to create cart order: ${error.message}`, 500);
    }
  }

  // Create order for single product payment
  async createSingleProductOrder(
    userId,
    productId,
    quantity = 1,
    selectedSize = null,
    selectedColor = null,
    shippingAddress = null,
    notes = ''
  ) {
    try {
      // Get product details using DAO
      const product = await productDAO.findProductById(productId);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      if (!product.in_stock) {
        throw new AppError('Product is out of stock', 400);
      }

      // Validate quantity
      if (quantity <= 0 || quantity > 50) {
        throw new AppError('Invalid quantity', 400);
      }

      // Convert product price to INR if needed
      const priceInINR =
        product.currency === 'INR'
          ? product.final_price
          : convertCurrency(product.final_price, product.currency, 'INR');

      // Calculate total amount in paise (INR)
      const totalAmount = Math.round(priceInINR * quantity * 100);

      // Create Razorpay order
      const razorpayOrder = await this.razorpay.orders.create({
        amount: totalAmount,
        currency: 'INR',
        receipt: this.generateOrderId(),
        notes: {
          user_id: userId.toString(),
          order_type: 'single_product',
          product_id: productId.toString(),
          quantity: quantity.toString(),
          notes: notes || '',
        },
      });

      // Create payment record using DAO
      const payment = await paymentDAO.create({
        user: userId,
        orderId: razorpayOrder.receipt,
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        currency: 'INR',
        status: 'created',
        orderType: 'single_product',
        singleProduct: {
          product: productId,
          quantity,
          price: product.final_price, // Original price
          priceInINR: priceInINR, // Converted price
          originalCurrency: product.currency,
          selectedSize,
          selectedColor,
        },
        shippingAddress,
        notes,
      });

      return {
        success: true,
        orderId: razorpayOrder.id,
        amount: totalAmount,
        currency: 'INR',
        receipt: razorpayOrder.receipt,
        paymentId: payment._id,
        productSummary: {
          productName: product.product_name,
          price: product.final_price, // Original price
          priceInINR: priceInINR, // Converted price
          originalCurrency: product.currency,
          quantity,
          totalAmount: product.final_price * quantity, // Original total
          totalAmountINR: priceInINR * quantity, // INR total
          selectedSize,
          selectedColor,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        `Failed to create single product order: ${error.message}`,
        500
      );
    }
  }

  // Verify payment signature
  verifyPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  ) {
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === razorpaySignature;
  }

  // Verify and confirm payment
  async verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    try {
      // Verify signature
      const isValidSignature = this.verifyPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );

      if (!isValidSignature) {
        throw new AppError('Invalid payment signature', 400);
      }

      // Find payment record using DAO
      const payment = await paymentDAO.findByRazorpayOrderId(razorpayOrderId);
      if (!payment) {
        throw new AppError('Payment record not found', 404);
      }

      if (payment.status === 'paid') {
        throw new AppError('Payment already verified', 400);
      }

      // Fetch payment details from Razorpay
      const razorpayPayment =
        await this.razorpay.payments.fetch(razorpayPaymentId);

      // Update payment status using DAO
      await paymentDAO.updateWithPaymentDetails(
        payment._id,
        razorpayPaymentId,
        razorpaySignature,
        razorpayPayment.method
      );

      // If it's a cart payment, clear the cart using DAO
      if (payment.orderType === 'cart') {
        await cartDAO.clearCart(payment.user);
      }

      return {
        success: true,
        message: 'Payment verified successfully',
        paymentId: payment._id,
        orderId: payment.orderId,
        amount: payment.amount,
        status: payment.status,
        paidAt: payment.paidAt,
        razorpayPaymentDetails: {
          id: razorpayPayment.id,
          amount: razorpayPayment.amount,
          currency: razorpayPayment.currency,
          method: razorpayPayment.method,
          status: razorpayPayment.status,
          captured: razorpayPayment.captured,
        },
      };
    } catch (error) {
      // Mark payment as failed if it exists
      const payment = await paymentDAO.findByRazorpayOrderId(razorpayOrderId);
      if (payment && payment.status !== 'paid') {
        await paymentDAO.updateStatus(payment._id, 'failed', {
          failureReason: error.message,
        });
      }

      if (error instanceof AppError) throw error;
      throw new AppError(`Payment verification failed: ${error.message}`, 500);
    }
  }

  // Get payment details
  async getPaymentDetails(paymentId) {
    try {
      const payment = await paymentDAO.findById(paymentId, true);

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      return payment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        `Failed to get payment details: ${error.message}`,
        500
      );
    }
  }

  // Get user's payment history
  async getUserPaymentHistory(userId, status = null, page = 1, limit = 10) {
    try {
      const options = {
        status,
        page,
        limit,
        sort: { createdAt: -1 },
      };

      return await paymentDAO.getUserPayments(userId, options);
    } catch (error) {
      throw new AppError(
        `Failed to get payment history: ${error.message}`,
        500
      );
    }
  }

  // Refund payment
  async refundPayment(paymentId, refundAmount = null, reason = '') {
    try {
      const payment = await paymentDAO.findById(paymentId);
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      if (payment.status !== 'paid') {
        throw new AppError('Payment is not eligible for refund', 400);
      }

      const refundAmountInPaise =
        refundAmount &&
        refundAmount > 0 &&
        Math.round(refundAmount * 100) <= payment.amount
          ? Math.round(refundAmount * 100)
          : payment.amount;

      // Create refund in Razorpay
      const refund = await this.razorpay.payments.refund(
        payment.razorpayPaymentId,
        {
          amount: refundAmountInPaise,
          notes: {
            reason: reason || 'Customer request',
            refund_date: new Date().toISOString(),
          },
        }
      );

      // Update payment record using DAO
      await paymentDAO.addRefundInfo(payment._id, {
        refundId: refund.id,
        amount: refundAmountInPaise,
        reason,
      });

      return {
        success: true,
        message: 'Refund processed successfully',
        refundId: refund.id,
        refundAmount: refundAmountInPaise / 100,
        status: refund.status,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Refund failed: ${error.message}`, 500);
    }
  }

  // Handle Razorpay webhooks
  async handleWebhook(signature, payload) {
    try {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', config.razorpay.keySecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== expectedSignature) {
        throw new AppError('Invalid webhook signature', 400);
      }

      const { event, payload: eventPayload } = payload;

      switch (event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(eventPayload.payment.entity);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(eventPayload.payment.entity);
          break;
        case 'refund.processed':
          await this.handleRefundProcessed(eventPayload.refund.entity);
          break;
        default:
          logger.info(`Unhandled webhook event: ${event}`);
      }

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      logger.error('Webhook processing error:', error);
      throw new AppError(`Webhook processing failed: ${error.message}`, 500);
    }
  }

  // Handle payment captured webhook
  async handlePaymentCaptured(paymentData) {
    const payment = await paymentDAO.findByRazorpayOrderId(
      paymentData.order_id
    );
    if (payment && payment.status !== 'paid') {
      await paymentDAO.updateWithPaymentDetails(
        payment._id,
        paymentData.id,
        null,
        paymentData.method
      );
      // Store webhook data
      await paymentDAO.updateStatus(payment._id, 'paid', {
        webhookData: paymentData,
      });
    }
  }

  // Handle payment failed webhook
  async handlePaymentFailed(paymentData) {
    const payment = await paymentDAO.findByRazorpayOrderId(
      paymentData.order_id
    );
    if (payment && payment.status !== 'failed') {
      await paymentDAO.updateStatus(payment._id, 'failed', {
        failureReason: `Payment failed: ${paymentData.error_description}`,
        webhookData: paymentData,
      });
    }
  }

  // Handle refund processed webhook
  async handleRefundProcessed(refundData) {
    const payment = await paymentDAO.findByRazorpayPaymentId(
      refundData.payment_id
    );
    if (payment) {
      await paymentDAO.addRefundInfo(payment._id, {
        refundId: refundData.id,
        amount: refundData.amount,
        reason: 'Webhook notification',
      });
      // Store webhook data
      await paymentDAO.updateStatus(payment._id, 'refunded', {
        webhookData: refundData,
      });
    }
  }
}

export default new PaymentService();
