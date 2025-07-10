import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/user.model.js';

let mongoServer;

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
});

afterEach(async () => {
  await User.deleteMany();
});

describe('User API - GET /api/v1/users/all', () => {
  it('✅ should return all users with default pagination', async () => {
    const res = await request(app).get('/api/v1/users/all');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.pagination).toHaveProperty('total');
    expect(res.body.pagination.page).toBe(1);
  });

  it('✅ should return users with given limit', async () => {
    const res = await request(app).get('/api/v1/users/all?limit=2');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination.limit).toBe(2);
  });

  it('❌ should return 422 if requested limit exceeds max allowed', async () => {
    const res = await request(app).get('/api/v1/users/all?limit=10');
    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.limit).toMatch(/Limit must be between 1 and 5/i);
  });

  it('❌ should return 422 for invalid page number', async () => {
    const res = await request(app).get('/api/v1/users/all?page=0');
    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.page).toMatch(/Page must be a positive integer/i);
  });

  it('❌ should return 422 for invalid limit', async () => {
    const res = await request(app).get('/api/v1/users/all?limit=-5');
    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.limit).toMatch(/Limit must be between 1 and 5/i);
  });

  it('❌ should return error for requesting non-existent page', async () => {
    const res = await request(app).get('/api/v1/users/all?page=1000&limit=1');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Only \d+ page/i);
  });
});