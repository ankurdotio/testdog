import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/user.model.js';

let mongoServer;
let adminToken;
let userToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Close existing connection if already open (from app.js maybe)
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

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

  // Create regular users
  await User.create([
    {
      username: 'user1',
      name: 'Xavier Rodgriues',
      email: 'user1@example.com',
      password: 'Password@123',
      role: 'user',
      isEmailVerified: true,
    },
    {
      username: 'user2',
      name: 'Ali Ansari',
      email: 'user2@example.com',
      password: 'Password@123',
      role: 'user',
      isEmailVerified: true,
    },
    {
      username: 'user3',
      name: 'Dev Tester',
      email: 'user3@example.com',
      password: 'Password@123',
      role: 'user',
      isEmailVerified: true,
    },
  ]);

  // Login admin to get token
  const adminResponse = await request(app).post('/api/v1/auth/login').send({
    email: 'admin@test.com',
    password: 'Password123!',
  });
  adminToken = adminResponse.body.accessToken;

  // Login regular user to get token
  const userResponse = await request(app).post('/api/v1/auth/login').send({
    email: 'user1@example.com',
    password: 'Password@123',
  });
  userToken = userResponse.body.accessToken;
});

afterEach(async () => {
  await User.deleteMany();
});

describe('User API - GET /api/v1/users/all', () => {
  describe('Authentication Tests', () => {
    it('should return 401 when no token provided', async () => {
      const res = await request(app).get('/api/v1/users/all');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not logged in/i);
    });

    it('should return 403 when regular user tries to access', async () => {
      const res = await request(app)
        .get('/api/v1/users/all')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not have permission/i);
    });

    it('should allow admin access', async () => {
      const res = await request(app)
        .get('/api/v1/users/all')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Pagination Tests', () => {
    it('should return all users with default pagination', async () => {
      const res = await request(app)
        .get('/api/v1/users/all')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.pagination).toHaveProperty('total');
      expect(res.body.pagination.page).toBe(1);
    });

    it('should return users with given limit', async () => {
      const res = await request(app)
        .get('/api/v1/users/all?limit=2')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.pagination.limit).toBe(2);
    });

    it('should return 422 if requested limit exceeds max allowed', async () => {
      const res = await request(app)
        .get('/api/v1/users/all?limit=100')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.limit).toMatch(/Limit must be between 1 and 50/i);
    });

    it('should return 422 for invalid page number', async () => {
      const res = await request(app)
        .get('/api/v1/users/all?page=0')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.page).toMatch(/Page must be a positive integer/i);
    });

    it('should return 422 for invalid limit', async () => {
      const res = await request(app)
        .get('/api/v1/users/all?limit=-5')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.limit).toMatch(/Limit must be between 1 and 50/i);
    });

    it('should return error for requesting non-existent page', async () => {
      const res = await request(app)
        .get('/api/v1/users/all?page=1000&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Only \d+ page/i);
    });
  });

  describe('Data Security Tests', () => {
    it('should not expose sensitive fields', async () => {
      const res = await request(app)
        .get('/api/v1/users/all')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);

      // Check that sensitive fields are not exposed
      const firstUser = res.body.data[0];
      expect(firstUser).not.toHaveProperty('password');
      expect(firstUser).not.toHaveProperty('isEmailVerified');
      expect(firstUser).not.toHaveProperty('__v');

      // Check that safe fields are present
      expect(firstUser).toHaveProperty('username');
      expect(firstUser).toHaveProperty('email');
      expect(firstUser).toHaveProperty('name');
      expect(firstUser).toHaveProperty('role');
    });

    it('should return users in descending order by creation date', async () => {
      const res = await request(app)
        .get('/api/v1/users/all')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);

      const users = res.body.data;
      expect(users.length).toBeGreaterThan(1);

      // Check that users are sorted by newest first
      for (let i = 0; i < users.length - 1; i++) {
        const currentUserDate = new Date(users[i].createdAt);
        const nextUserDate = new Date(users[i + 1].createdAt);
        expect(currentUserDate >= nextUserDate).toBe(true);
      }
    });
  });
});
