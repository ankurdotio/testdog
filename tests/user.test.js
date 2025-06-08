import request from 'supertest';
import app from '../src/app';

describe('User Auth Routes', () => {
  test('POST /register - success', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test@1234',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('user');
  });
});
