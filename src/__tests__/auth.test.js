// src/__tests__/auth.test.js
import request from 'supertest';
import app from '../app.js'; // Your main Express app
import User from '../models/user.model.js'; // Your User model
import redisService from '../config/redis.js'; // Your Redis service


describe('Auth API Routes', () => {
  // Test for User Registration
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.username).toBe(userData.username);
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();

      // Verify cookies are set
      const cookies = response.headers['set-cookie'];
      expect(cookies.some(cookie => cookie.startsWith('accessToken='))).toBe(true);
      expect(cookies.some(cookie => cookie.startsWith('refreshToken='))).toBe(true);


      // Verify user in database
      const dbUser = await User.findOne({ email: userData.email });
      expect(dbUser).not.toBeNull();
      expect(dbUser.username).toBe(userData.username);

      // Verify refresh token in Redis
      const redisToken = await redisService.get(`refreshToken:${dbUser._id}`);
      expect(redisToken).toBe(response.body.refreshToken);
    });

    it('should return 400 if email already exists', async () => {
      // First, create a user
      await User.create({
        username: 'existinguser',
        email: 'exists@example.com',
        password: 'Password123!',
      });

      const userData = {
        username: 'newuser',
        email: 'exists@example.com', // Duplicate email
        password: 'Password456!',
        name: 'New User',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already registered.');
    });

    it('should return 422 for invalid registration data (e.g., missing email)', async () => {
        const userData = {
            username: 'testuserInvalid',
            // email is missing
            password: 'Password123!',
            name: 'Test User Invalid'
        };

        const response = await request(app)
            .post('/api/v1/auth/register')
            .send(userData)
            .expect('Content-Type', /json/)
            .expect(422); // Validation error

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
        expect(response.body.errors.email).toBe('Email is required');
    });
  });

  // Test for User Login
  describe('POST /api/v1/auth/login', () => {
    const loginCredentials = {
      email: 'login@example.com',
      password: 'PasswordSecure1!',
    };

    beforeEach(async () => {
      // Create a user to login with
      await User.create({
        username: 'loginuser',
        email: loginCredentials.email,
        password: loginCredentials.password, // Password will be hashed by pre-save hook
        name: 'Login User',
      });
    });

    it('should login an existing user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginCredentials)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(loginCredentials.email);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();

      // Verify cookies
      const cookies = response.headers['set-cookie'];
      expect(cookies.some(cookie => cookie.startsWith('accessToken='))).toBe(true);
      expect(cookies.some(cookie => cookie.startsWith('refreshToken='))).toBe(true);


      // Verify refresh token in Redis
      const dbUser = await User.findOne({ email: loginCredentials.email });
      const redisToken = await redisService.get(`refreshToken:${dbUser._id}`);
      expect(redisToken).toBe(response.body.refreshToken);
    });

    it('should return 401 for invalid credentials (wrong password)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: loginCredentials.email, password: 'WrongPassword!' })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password.');
    });

    it('should return 401 for non-existent user', async () => {
        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'nonexistent@example.com', password: 'Password123!'})
            .expect('Content-Type', /json/)
            .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid email or password.');
    });

    it('should return 422 for invalid login data (e.g., invalid email format)', async () => {
        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'notanemail', password: 'Password123!'})
            .expect('Content-Type', /json/)
            .expect(422);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
        expect(response.body.errors.email).toBe('Please provide a valid email');
    });
  });

  // Add more describe blocks for other auth routes like /getme, /logout, /access-token etc.
  // Example for /getme (protected route)
  describe('GET /api/v1/auth/getme', () => {
    let token;
    let userId;

    beforeEach(async () => {
      // Register and login a user to get a token
      const userData = {
        username: 'getmeuser',
        email: 'getme@example.com',
        password: 'PasswordGetMe1!',
        name: 'GetMe User',
      };
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      token = registerResponse.body.accessToken;
      userId = registerResponse.body.data._id; // Assuming _id is returned
    });

    it('should return user details for a logged-in user', async () => {
      const response = await request(app)
        .get('/api/v1/auth/getme')
        .set('Cookie', [`accessToken=${token}`]) // Set cookie for authentication
        // OR .set('Authorization', `Bearer ${token}`) if you also support header auth
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('getme@example.com');
      expect(response.body.data._id).toBe(userId);
    });

    it('should return 401 if no token is provided', async () => {
      const response = await request(app)
        .get('/api/v1/auth/getme')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You are not logged in. Please log in to get access.');
    });
  });
});