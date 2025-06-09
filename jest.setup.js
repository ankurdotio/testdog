import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Redis from 'ioredis-mock'; // Import the mock
import config from './src/config/config.js'; // Your app's config
import redisService from './src/config/redis.js'; // Your redis service

let mongod;

// Mock ioredis before any of your modules try to import the real one
// Correct way to mock ioredis
jest.mock('ioredis', () => {
  // Require 'ioredis-mock' inside the factory function.
  // This ensures it's resolved correctly during Jest's mocking phase.
  const IORedisMock = require('ioredis-mock');
  return IORedisMock; // The mock will replace the 'ioredis' module
});

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  config.DB_URL = uri; // Override DB_URL in your config for tests

  // It's important to disconnect and reconnect mongoose if it was already connected
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri);

  // Re-initialize your Redis service with the mock if needed,
  // or ensure it uses the mocked 'ioredis' when it initializes.
  // Since we globally mocked 'ioredis', your redisService should pick up the mock.
  // You might need to adjust your redisService to be more easily testable
  // or ensure it re-initializes its client if it's already created one.

  // For your current redis.js, it creates an instance on import.
  // We need to ensure it uses the mocked Redis.
  // A simple way is to re-assign its client or re-initialize.

  // If your redisService.connect() can be called multiple times or re-initializes the client:
  await redisService.disconnect(); // Disconnect if already connected
  redisService.client = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    db: config.redis.db,
  }); // Manually set the client to the mock instance
  // Or, if your redisService.connect() re-creates the client with the (now mocked) ioredis:
  // await redisService.connect();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
  if (redisService && typeof redisService.disconnect === 'function') {
    await redisService.disconnect();
  }
  jest.clearAllMocks(); // Clear all mocks after tests are done
});

// Optional: Clear database between each test
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }

  // Clear Redis mock data before each test
  if (
    redisService.client &&
    typeof redisService.client.flushdb === 'function'
  ) {
    await redisService.client.flushdb();
  }
});
