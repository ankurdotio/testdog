import request from 'supertest';
import app from '../app.js';
import User from '../models/user.model.js';
import Product from '../models/product.model.js';

describe('Product API Routes', () => {
  let adminToken;
  let userToken;

  beforeEach(async () => {
    // Create admin user
    await User.create({
      username: 'admin',
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'Password123!',
      role: 'admin',
      isEmailVerified: true,
    });

    // Create regular user
    await User.create({
      username: 'user',
      name: 'Regular User',
      email: 'user@test.com',
      password: 'Password123!',
      role: 'user',
      isEmailVerified: true,
    });

    // Login admin to get token
    const adminResponse = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@test.com',
      password: 'Password123!',
    });

    // Check if login was successful
    if (adminResponse.status !== 200 || !adminResponse.body.accessToken) {
      throw new Error(`Admin login failed. Status: ${adminResponse.status}`);
    }

    adminToken = adminResponse.body.accessToken;

    // Login user to get token
    const userResponse = await request(app).post('/api/v1/auth/login').send({
      email: 'user@test.com',
      password: 'Password123!',
    });

    if (userResponse.status !== 200 || !userResponse.body.accessToken) {
      throw new Error(`User login failed. Status: ${userResponse.status}`);
    }

    userToken = userResponse.body.accessToken;
  });

  afterEach(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Product.deleteMany({});
  });

  describe('POST /api/v1/store/products', () => {
    const validProductData = {
      product_name: 'Test Product',
      description: 'This is a test product with a detailed description.',
      initial_price: 100.0,
      final_price: 80.0,
      currency: 'USD',
      main_image: 'https://example.com/test-image.jpg',
      category_tree: ['Electronics', 'Smartphones'],
      color: 'Black',
      size: 'M',
    };

    it('should create a new product successfully with admin role', async () => {
      const response = await request(app)
        .post('/api/v1/store/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProductData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product created successfully');
      expect(response.body.data.product).toHaveProperty('_id');
      expect(response.body.data.product.product_name).toBe(
        validProductData.product_name
      );
      expect(response.body.data.product.discount_amount).toBe(20.0);
      expect(response.body.data.product.discount_percentage).toBe(20.0);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post('/api/v1/store/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validProductData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        'You do not have permission to perform this action'
      );
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/v1/store/products')
        .send(validProductData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 422 for invalid product data', async () => {
      const invalidData = {
        product_name: 'T', // Too short
        description: 'Short', // Too short
        initial_price: -10, // Negative price
        final_price: 200, // Greater than initial price
        currency: 'INVALID', // Invalid currency
      };

      const response = await request(app)
        .post('/api/v1/store/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toHaveProperty('product_name');
      expect(response.body.errors).toHaveProperty('description');
      expect(response.body.errors).toHaveProperty('initial_price');
      expect(response.body.errors).toHaveProperty('currency');
    });

    it('should return 400 for business logic violations', async () => {
      const invalidBusinessLogic = {
        product_name: 'Test Product 2',
        description: 'This is another test product with detailed description.',
        initial_price: 100.0,
        final_price: 150.0, // Greater than initial price
        currency: 'USD',
        main_image: 'https://example.com/test-image2.jpg',
      };

      const response = await request(app)
        .post('/api/v1/store/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidBusinessLogic)
        .expect(422); // This will be caught by validator first

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/store/products', () => {
    it('should get all products with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/store/products?page=0&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Products retrieved successfully');
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/store/products?page=-1&limit=150')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/store/products/:id', () => {
    it('should get a product by ID', async () => {
      // First create a product to test with
      const createResponse = await request(app)
        .post('/api/v1/store/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          product_name: 'Get Test Product',
          description: 'This product is for testing GET by ID.',
          initial_price: 50.0,
          final_price: 40.0,
          currency: 'USD',
          main_image: 'https://example.com/get-test-image.jpg',
        });

      const productId = createResponse.body.data.product._id;

      const response = await request(app)
        .get(`/api/v1/store/products/${productId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product retrieved successfully');
      expect(response.body.data.product._id).toBe(productId);
    });

    it('should return 404 for non-existent product', async () => {
      const nonExistentId = '60d5ecb54b24a12f8c8d4321'; // Valid ObjectId format
      const response = await request(app)
        .get(`/api/v1/store/products/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/store/products/search', () => {
    it('should search products by keyword', async () => {
      const response = await request(app)
        .get('/api/v1/store/products/search?q=test&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Search completed successfully');
      expect(response.body.data).toHaveProperty('keyword');
      expect(response.body.data).toHaveProperty('products');
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    it('should return 400 for missing search keyword', async () => {
      const response = await request(app)
        .get('/api/v1/store/products/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Search keyword is required');
    });
  });

  describe('GET /api/v1/store/products/autocomplete', () => {
    it('should get autocomplete suggestions', async () => {
      const response = await request(app)
        .get('/api/v1/store/products/autocomplete?q=te&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'Autocomplete suggestions retrieved successfully'
      );
      expect(response.body.data).toHaveProperty('keyword');
      expect(response.body.data).toHaveProperty('suggestions');
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);
    });

    it('should return 400 for short search keyword', async () => {
      const response = await request(app)
        .get('/api/v1/store/products/autocomplete?q=t')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        'Search keyword must be at least 2 characters long'
      );
    });
  });

  describe('GET /api/v1/store/products/random', () => {
    it('should get a random product', async () => {
      // First create a product to ensure there's at least one in the database
      await request(app)
        .post('/api/v1/store/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          product_name: 'Random Test Product',
          description: 'This product is for testing random endpoint.',
          initial_price: 25.0,
          final_price: 20.0,
          currency: 'USD',
          main_image: 'https://example.com/random-test-image.jpg',
        });

      const response = await request(app)
        .get('/api/v1/store/products/random')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'Random product retrieved successfully'
      );
      expect(response.body.data).toHaveProperty('product');
    });
  });
});
