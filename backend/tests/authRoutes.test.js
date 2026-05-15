import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server';

const uniqueUser = () => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    username: `testuser-${id}`,
    email: `test-${id}@example.com`,
    password: 'password123',
  };
};

describe('Auth API Routes', () => {

  beforeEach(() => {
    process.env.JWT_SECRET = 'testsecret';
  });

  describe('POST /api/auth/register', () => {
    it('Should register a valid new user', async () => {
      const user = uniqueUser();

      const response = await request(app)
        .post('/api/auth/register')
        .send(user);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.email).toBe(user.email);
    });

    it('Should return 400 if user exists', async () => {
      const user = uniqueUser();
      await request(app).post('/api/auth/register').send(user);

      const response = await request(app)
        .post('/api/auth/register')
        .send(user);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('Should login an existing user with correct password', async () => {
      const user = uniqueUser();
      await request(app).post('/api/auth/register').send(user);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: user.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('Should return 400 for incorrect password', async () => {
      const user = uniqueUser();
      await request(app).post('/api/auth/register').send(user);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid email or password');
    });
  });
});
