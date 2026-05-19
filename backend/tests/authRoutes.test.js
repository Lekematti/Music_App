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

    it('Should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Please enter a valid email address');
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

    it('Should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Please enter a valid email address');
    });
  });

  describe('GET /api/auth/me', () => {
    it('Should fetch current user info when token is provided', async () => {
      const user = uniqueUser();
      
      // Register
      const res = await request(app).post('/api/auth/register').send(user);
      const token = res.body.token;

      // Get me
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.email).toBe(user.email);
      expect(meRes.body.username).toBe(user.username);
    });

    it('Should return 401 if token is invalid or missing', async () => {
      const meRes = await request(app).get('/api/auth/me');
      
      expect(meRes.status).toBe(401);
      expect(meRes.body.message).toBe('Not authorized, token missing');
    });
  });
});
