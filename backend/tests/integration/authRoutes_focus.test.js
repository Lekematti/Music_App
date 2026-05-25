import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import bcrypt from 'bcryptjs';

describe('Focused authRoutes tests', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('register returns 400 when fields missing', async () => {
    const router = require('../../routes/authRoutes');
    const app = express();
    app.use(express.json());
    app.use(router);

    const res = await request(app).post('/register').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('register returns 400 when user already exists', async () => {
    // patch prisma after requiring router to avoid hoisting/mocking order issues
    const router = require('../../routes/authRoutes');
    const prisma = require('../../prisma/prismaClient');
    prisma.user = { findFirst: async () => ({ id: 'u1' }) };
    const app = express();
    app.use(express.json());
    app.use(router);

    const res = await request(app).post('/register').send({ username: 'abc', email: 'x@x.com', password: '123456' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'User with this email or username already exists');
  });

  it('login returns 400 for invalid credentials', async () => {
    const router = require('../../routes/authRoutes');
    const prisma = require('../../prisma/prismaClient');
    prisma.user = { findUnique: async () => null };
    const app = express();
    app.use(express.json());
    app.use(router);

    const res = await request(app).post('/login').send({ email: 'no@one.com', password: 'pw' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Invalid email or password');
  });

  it('login succeeds with correct password', async () => {
    const password = 'password1';
    const hashed = bcrypt.hashSync(password, 10);
    const router = require('../../routes/authRoutes');
    const prisma = require('../../prisma/prismaClient');
    prisma.user = { findUnique: async () => ({ id: 'u1', username: 'u', email: 'a@b.com', password: hashed }) };

    process.env.JWT_SECRET = 'shh';
    const app = express();
    app.use(express.json());
    app.use(router);

    const res = await request(app).post('/login').send({ email: 'a@b.com', password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('GET /me returns 404 when user not found and 200 when found', async () => {
    // first case: user not found
    process.env.JWT_SECRET = 'test-secret';
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ email: 'x@y.com' }, process.env.JWT_SECRET);

    let router = require('../../routes/authRoutes');
    let prisma = require('../../prisma/prismaClient');
    prisma.user = { findUnique: async () => null };
    let app = express();
    app.use(express.json());
    app.use(router);
    let res = await request(app).get('/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);

    // second case: user exists
    vi.resetModules();
    process.env.JWT_SECRET = 'test-secret';
    const token2 = jwt.sign({ email: 'x@y.com' }, process.env.JWT_SECRET);
    router = require('../../routes/authRoutes');
    prisma = require('../../prisma/prismaClient');
    prisma.user = { findUnique: async () => ({ id: 'u', username: 'u', email: 'x@y.com', avatarUrl: null }) };
    app = express();
    app.use(express.json());
    app.use(router);
    res = await request(app).get('/me').set('Authorization', `Bearer ${token2}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email', 'x@y.com');
  });
});
