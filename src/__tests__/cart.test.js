import request from 'supertest';
import app from '../app.js';
import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';

describe('Cart API', () => {
  let authToken;
  let userId;
  let productId;
  let cartItemId;

  const testUser = {
    username: 'cartuser',
    email: 'cartuser@test.com',
    password: 'Password123!',
    name: 'Cart Test User',
  };

  const testProduct = {
    product_name: 'Test Cart Product',
    description: 'A test product for cart functionality',
    initial_price: 100,
    final_price: 80,
    currency: 'USD',
    main_image: 'https://example.com/image.jpg',
    in_stock: true,
    all_available_sizes: ['S', 'M', 'L'],
    color: 'Red',
  };

  beforeAll(async () => {
    // Setup can happen here if needed
  });

  beforeEach(async () => {
    // Create test user before each test since the global beforeEach clears the database
    const testUserDoc = await User.create({
      username: testUser.username,
      email: testUser.email,
      password: testUser.password,
      name: testUser.name,
    });

    userId = testUserDoc._id.toString();

    // Generate token using the user service
    const userService = (await import('../services/user.service.js')).default;
    authToken = userService.generateAccessToken({
      userId: testUserDoc._id,
      username: testUserDoc.username,
      email: testUserDoc.email,
    });

    // Create test product for each test since the global beforeEach clears the database
    const product = await Product.create(testProduct);
    productId = product._id.toString();
  });

  afterAll(async () => {
    // Clean up test data
    await Cart.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
  });

  afterEach(async () => {
    // Clean up cart after each test
    await Cart.deleteMany({ user: userId });
  });

  describe('POST /api/v1/store/cart', () => {
    it('should add a product to cart successfully', async () => {
      const response = await request(app)
        .post('/api/v1/store/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 2,
          selectedSize: 'M',
          selectedColor: 'Red',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.items[0].quantity).toBe(2);
      expect(response.body.data.cart.items[0].selectedSize).toBe('M');
      expect(response.body.data.cart.totalItems).toBe(2);
      expect(response.body.data.cart.totalAmount).toBe(160); // 80 * 2

      cartItemId = response.body.data.cart.items[0]._id;
    });

    it('should increment quantity when adding same product with same attributes', async () => {
      // First add
      await request(app)
        .post('/api/v1/store/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 1,
          selectedSize: 'M',
        });

      // Second add with same attributes
      const response = await request(app)
        .post('/api/v1/store/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 2,
          selectedSize: 'M',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.items[0].quantity).toBe(3);
      expect(response.body.data.cart.totalItems).toBe(3);
    });

    it('should add separate items for different sizes', async () => {
      // Add with size M
      await request(app)
        .post('/api/v1/store/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 1,
          selectedSize: 'M',
        });

      // Add with size L
      const response = await request(app)
        .post('/api/v1/store/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 1,
          selectedSize: 'L',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.cart.items).toHaveLength(2);
      expect(response.body.data.cart.totalItems).toBe(2);
    });

    it('should return 422 for invalid product ID', async () => {
      const response = await request(app)
        .post('/api/v1/store/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'invalid-id',
          quantity: 1,
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeProductId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .post('/api/v1/store/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: fakeProductId,
          quantity: 1,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).post('/api/v1/store/cart').send({
        productId,
        quantity: 1,
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/store/cart', () => {
    beforeEach(async () => {
      // Add a product to cart for testing
      await request(app)
        .post('/api/v1/store/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 2,
          selectedSize: 'M',
        });
    });

    it('should get cart items successfully', async () => {
      const response = await request(app)
        .get('/api/v1/store/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.items[0].quantity).toBe(2);
      expect(response.body.data.cart.totalItems).toBe(2);
      expect(response.body.data.cart.items[0].product).toHaveProperty(
        'product_name'
      );
    });

    it('should return empty cart for new user', async () => {
      // Create new user directly in database
      const newUserDoc = await User.create({
        username: 'newcartuser',
        email: 'newcartuser@test.com',
        password: 'Password123!',
        name: 'New Cart User',
      });

      // Generate token for the new user
      const userService = (await import('../services/user.service.js')).default;
      const newAuthToken = userService.generateAccessToken({
        userId: newUserDoc._id,
        username: newUserDoc.username,
        email: newUserDoc.email,
      });

      const response = await request(app)
        .get('/api/v1/store/cart')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.cart.items).toHaveLength(0);
      expect(response.body.data.cart.totalItems).toBe(0);
      expect(response.body.data.cart.totalAmount).toBe(0);
    });
  });

  describe('PATCH /api/v1/store/cart/:id', () => {
    beforeEach(async () => {
      // Add a product to cart for testing
      const cartResponse = await request(app)
        .post('/api/v1/store/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 2,
          selectedSize: 'M',
        });

      cartItemId = cartResponse.body.data.cart.items[0]._id;
    });

    it('should update cart item quantity successfully', async () => {
      const response = await request(app)
        .patch(`/api/v1/store/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items[0].quantity).toBe(5);
      expect(response.body.data.cart.totalItems).toBe(5);
      expect(response.body.data.cart.totalAmount).toBe(400); // 80 * 5
    });

    it('should return 422 for invalid quantity', async () => {
      const response = await request(app)
        .patch(`/api/v1/store/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 0,
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent cart item', async () => {
      const fakeItemId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .patch(`/api/v1/store/cart/${fakeItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 3,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/store/cart/:id', () => {
    beforeEach(async () => {
      // Add a product to cart for testing
      const cartResponse = await request(app)
        .post('/api/v1/store/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 2,
          selectedSize: 'M',
        });

      cartItemId = cartResponse.body.data.cart.items[0]._id;
    });

    it('should remove cart item successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/store/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(0);
      expect(response.body.data.cart.totalItems).toBe(0);
      expect(response.body.data.cart.totalAmount).toBe(0);
    });

    it('should return 404 for non-existent cart item', async () => {
      const fakeItemId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/v1/store/cart/${fakeItemId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/store/cart/summary', () => {
    beforeEach(async () => {
      // Add products to cart for testing
      await request(app)
        .post('/api/v1/store/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 2,
          selectedSize: 'M',
        });

      await request(app)
        .post('/api/v1/store/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 1,
          selectedSize: 'L',
        });
    });

    it('should get cart summary successfully', async () => {
      const response = await request(app)
        .get('/api/v1/store/cart/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.totalItems).toBe(3);
      expect(response.body.data.summary.totalAmount).toBe(240); // (80 * 2) + (80 * 1)
      expect(response.body.data.summary.itemCount).toBe(2); // Two different items
      expect(response.body.data.summary.currency).toBe('USD');
    });
  });

  describe('DELETE /api/v1/store/cart (Clear Cart)', () => {
    beforeEach(async () => {
      // Add products to cart for testing
      await request(app)
        .post('/api/v1/store/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 2,
          selectedSize: 'M',
        });
    });

    it('should clear cart successfully', async () => {
      const response = await request(app)
        .delete('/api/v1/store/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(0);
      expect(response.body.data.cart.totalItems).toBe(0);
      expect(response.body.data.cart.totalAmount).toBe(0);
    });
  });
});
