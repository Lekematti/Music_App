import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../server';
import prisma from '../../prisma/prismaClient';

// Mock supabase storage client to avoid external calls
vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        storage: {
            from: () => ({
                upload: async () => ({ error: null }),
                getPublicUrl: (path) => ({ data: { publicUrl: `https://example.com/${path}` } }),
                remove: async () => ({ error: null }),
                download: async () => ({ data: new Blob(['x']), error: null }),
            }),
        },
    }),
}));

const uniqueUser = () => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    username: `testuser-${id}`,
    email: `test-${id}@example.com`,
    password: 'password123',
  };
};

describe('Auth APIs', () => {
    beforeEach(() => {
        process.env.JWT_SECRET = 'testsecret';
    });

    afterEach(async () => {
        // Cleanup any users created during tests
        // best-effort delete by email pattern
        await prisma.user.deleteMany({ where: { email: { contains: 'test-' } } }).catch(() => {});
    });

    it('registers a valid new user', async () => {
        const user = uniqueUser();
        const res = await request(app).post('/api/auth/register').send(user);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.email).toBe(user.email);
    });

    it('returns 400 for duplicate registration', async () => {
        const user = uniqueUser();
        await request(app).post('/api/auth/register').send(user);
        const res = await request(app).post('/api/auth/register').send(user);
        expect(res.status).toBe(400);
    });

    it('logs in an existing user', async () => {
        const user = uniqueUser();
        await request(app).post('/api/auth/register').send(user);
        const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('GET /api/auth/me returns user when token provided', async () => {
        const user = uniqueUser();
        const r = await request(app).post('/api/auth/register').send(user);
        const token = r.body.token;
        const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
        expect(me.status).toBe(200);
        expect(me.body.email).toBe(user.email);
    });
});
