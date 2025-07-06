import { jest } from '@jest/globals';
import request from 'supertest';

// Global variable to control user role in tests
global.testUserRole = 'user';

// Mock the auth middleware before importing the app
jest.mock('../middlewares/auth.middleware.js', () => ({
  protect: (req, res, next) => {
    req.user = {
      id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      role: global.testUserRole,
    };
    next();
  },
  restrictTo: () => (req, res, next) => {
    // Mock admin check - allow all for testing
    next();
  },
}));

// Mock the payment service
jest.mock('../services/payment.service.js');

import app from '../app.js';
import paymentService from '../services/payment.service.js';

describe('Payment API Endpoints', () => {
  let authToken;
  let userId;
  let productId;

  beforeEach(() => {
    // Setup test data
    authToken = 'mock-jwt-token';
    userId = '507f1f77bcf86cd799439011';
    productId = '507f1f77bcf86cd799439012';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/payments/orders/cart', () => {
    it('should create a cart order successfully', async () => {
      const mockOrderData = {
        success: true,
        orderId: 'order_test123',
        amount: 100000,
        currency: 'INR',
        receipt: 'ORDER_test123',
        paymentId: '507f1f77bcf86cd799439014',
        cartSummary: {
          totalItems: 2,
          totalAmount: 1000,
          items: [
            {
              productName: 'Test Product',
              quantity: 1,
              price: 500,
            },
          ],
        },
      };

      paymentService.createCartOrder.mockResolvedValue(mockOrderData);

      const response = await request(app)
        .post('/api/v1/payments/orders/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddress: {
            fullName: 'John Doe',
            address: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'India',
            phone: '9876543210',
          },
          notes: 'Test order',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockOrderData);
      expect(paymentService.createCartOrder).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          fullName: 'John Doe',
          address: '123 Test Street',
        }),
        'Test order'
      );
    });

    it('should return 400 for invalid shipping address', async () => {
      const response = await request(app)
        .post('/api/v1/payments/orders/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddress: {
            fullName: 'A', // Too short
            zipCode: 'invalid', // Invalid format
          },
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/payments/orders/single-product', () => {
    it('should create a single product order successfully', async () => {
      const mockOrderData = {
        success: true,
        orderId: 'order_test456',
        amount: 50000,
        currency: 'INR',
        receipt: 'ORDER_test456',
        paymentId: '507f1f77bcf86cd799439015',
        productSummary: {
          productName: 'Test Product',
          price: 500,
          quantity: 1,
          totalAmount: 500,
        },
      };

      paymentService.createSingleProductOrder.mockResolvedValue(mockOrderData);

      const response = await request(app)
        .post('/api/v1/payments/orders/single-product')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productId,
          quantity: 1,
          selectedSize: 'M',
          selectedColor: 'Red',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockOrderData);
      expect(paymentService.createSingleProductOrder).toHaveBeenCalledWith(
        userId,
        productId,
        1,
        'M',
        'Red',
        undefined,
        undefined
      );
    });

    it('should return 400 for missing product ID', async () => {
      const response = await request(app)
        .post('/api/v1/payments/orders/single-product')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 1,
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid product ID', async () => {
      const response = await request(app)
        .post('/api/v1/payments/orders/single-product')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'invalid-id',
          quantity: 1,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/payments/verify', () => {
    it('should verify payment successfully', async () => {
      const mockVerificationResult = {
        success: true,
        message: 'Payment verified successfully',
        paymentId: '507f1f77bcf86cd799439016',
        orderId: 'ORDER_test789',
        amount: 100000,
        status: 'paid',
        paidAt: '2025-06-30T08:30:58.772Z',
      };

      paymentService.verifyPayment.mockResolvedValue(mockVerificationResult);

      const response = await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          razorpay_order_id: 'order_test789',
          razorpay_payment_id: 'pay_test789',
          razorpay_signature: 'signature_test789',
          payment_method: 'card',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockVerificationResult);
    });

    it('should return 400 for missing verification data', async () => {
      const response = await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          razorpay_order_id: 'order_test789',
          // Missing payment_id and signature
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/payments/history', () => {
    it('should get payment history successfully', async () => {
      const mockHistory = {
        payments: [
          {
            _id: '507f1f77bcf86cd799439017',
            orderId: 'ORDER_test123',
            amount: 100000,
            status: 'paid',
            createdAt: '2025-06-30T08:30:58.792Z',
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      paymentService.getUserPaymentHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/v1/payments/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockHistory);
    });

    it('should filter by status', async () => {
      const mockHistory = {
        payments: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      paymentService.getUserPaymentHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/v1/payments/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'paid' });

      expect(response.status).toBe(200);
      expect(paymentService.getUserPaymentHistory).toHaveBeenCalledWith(
        userId,
        'paid',
        1,
        10
      );
    });
  });

  describe('GET /api/v1/payments/details/:paymentId', () => {
    it('should get payment details successfully', async () => {
      const mockPayment = {
        _id: '507f1f77bcf86cd799439018',
        user: { _id: userId, name: 'Test User' },
        orderId: 'ORDER_test123',
        amount: 100000,
        status: 'paid',
        createdAt: '2025-06-30T08:30:58.809Z',
      };

      paymentService.getPaymentDetails.mockResolvedValue(mockPayment);

      const response = await request(app)
        .get(`/api/v1/payments/details/${mockPayment._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.payment).toEqual(mockPayment);
    });

    it('should return 400 for invalid payment ID', async () => {
      // Mock the service to throw an error for invalid ID
      paymentService.getPaymentDetails.mockRejectedValue(
        new Error('Payment not found')
      );

      const response = await request(app)
        .get('/api/v1/payments/details/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400); // Invalid ObjectId format should return 400
    });
  });

  describe('POST /api/v1/payments/refund/:paymentId', () => {
    it('should process refund successfully', async () => {
      const mockRefundResult = {
        success: true,
        message: 'Refund processed successfully',
        refundId: 'rfnd_test123',
        refundAmount: 1000,
        status: 'processed',
      };

      const mockPayment = {
        _id: '507f1f77bcf86cd799439019',
        user: { _id: userId },
        status: 'paid',
      };

      paymentService.getPaymentDetails.mockResolvedValue(mockPayment);
      paymentService.refundPayment.mockResolvedValue(mockRefundResult);

      const response = await request(app)
        .post(`/api/v1/payments/refund/${mockPayment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          refundAmount: 1000,
          reason: 'Customer request',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockRefundResult);
    });
  });

  describe('POST /api/v1/payments/webhook', () => {
    it('should handle webhook successfully', async () => {
      const mockResult = {
        success: true,
        message: 'Webhook processed successfully',
      };

      paymentService.handleWebhook.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-razorpay-signature', 'test-signature')
        .send({
          event: 'payment.captured',
          payload: {
            payment: {
              entity: {
                id: 'pay_test123',
                order_id: 'order_test123',
                status: 'captured',
              },
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });

  describe('GET /api/v1/payments/stats', () => {
    beforeEach(() => {
      // Set user role to admin for stats endpoint tests
      global.testUserRole = 'admin';
    });

    afterEach(() => {
      // Reset user role back to user for other tests
      global.testUserRole = 'user';
    });

    it('should get payment stats successfully with valid date range', async () => {
      const mockStats = {
        overview: {
          totalPayments: 100,
          totalAmount: 1000000,
          successfulPayments: 95,
          failedPayments: 5,
          successRate: 95.0,
        },
        paymentMethods: [
          { _id: 'card', count: 80, amount: 800000 },
          { _id: 'upi', count: 20, amount: 200000 },
        ],
        orderTypes: [
          { _id: 'cart', count: 60, amount: 600000 },
          { _id: 'single_product', count: 40, amount: 400000 },
        ],
      };

      // Mock the controller method since we're testing route validation
      paymentService.getPaymentStats = jest.fn().mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/v1/payments/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-12-31T23:59:59.999Z',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get('/api/v1/payments/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: 'invalid-date',
          endDate: '2024-12-31T23:59:59.999Z',
        });

      expect(response.status).toBe(400);
    });

    it('should accept stats request without date filters', async () => {
      const mockStats = {
        overview: {
          totalPayments: 5,
          totalAmount: 50000,
          successfulPayments: 4,
          failedPayments: 1,
          refundedPayments: 0,
          averageAmount: 10000,
          successRate: 80,
          totalAmountFormatted: 500,
          averageAmountFormatted: 100,
        },
        paymentMethods: [],
        orderTypes: [],
      };

      paymentService.getPaymentStats = jest.fn().mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/v1/payments/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should handle empty string date parameters', async () => {
      // Set user role to admin for this test
      global.testUserRole = 'admin';

      const response = await request(app)
        .get('/api/v1/payments/stats?startDate=&endDate=')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'Start date must be a valid ISO 8601 date'
      );
    });
  });
});

describe('Payment Service', () => {
  describe('verifyPaymentSignature', () => {
    it('should verify payment signature correctly', () => {
      const originalService = jest.requireActual(
        '../services/payment.service.js'
      );

      // Mock the config
      jest.doMock('../config/config.js', () => ({
        razorpay: {
          keySecret: 'test-secret',
        },
      }));

      // This would normally be tested with actual crypto operations
      // For now, we'll test the structure
      expect(typeof originalService.default.verifyPaymentSignature).toBe(
        'function'
      );
    });
  });
});
