import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import request from 'supertest';
import app from '../../server';
import prisma from '../../prisma/prismaClient';

const require = createRequire(import.meta.url);
const authRoutes = require('../../routes/authRoutes');

const mockSupabaseClient = {
    storage: {
        from: () => ({
            upload: async () => ({ error: null }),
            getPublicUrl: (path) => ({ data: { publicUrl: `https://example.com/${path}` } }),
            remove: async () => ({ error: null }),
            download: async () => ({ data: new Blob(['x']), error: null }),
        }),
    },
};

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
        authRoutes.setSupabaseClient(mockSupabaseClient);
    });

    afterEach(async () => {
        authRoutes.setSupabaseClient(null);
        // Cleanup any users created during tests
        // best-effort delete by email pattern
        await prisma.user.deleteMany({ where: { email: { contains: 'test-' } } }).catch(() => {});
    });

    it('registers a valid new user', async () => {
        const user = uniqueUser();
        const res = await request(app)
            .post('/api/auth/register')
            .field('username', user.username)
            .field('email', user.email)
            .field('password', user.password)
            .attach('avatarFile', Buffer.from('fake-image-data'), {
                filename: 'avatar.png',
                contentType: 'image/png',
            });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.email).toBe(user.email);
        expect(res.body.avatarUrl).toMatch(/^https:\/\/example\.com\/.+\.png$/);
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
        const r = await request(app)
            .post('/api/auth/register')
            .field('username', user.username)
            .field('email', user.email)
            .field('password', user.password);
        const token = r.body.token;
        const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
        expect(me.status).toBe(200);
        expect(me.body.email).toBe(user.email);
        expect(me.body.avatarUrl).toBeNull();
    });

    it('uploads a profile picture for the logged in user', async () => {
        const user = uniqueUser();
        const registered = await request(app)
            .post('/api/auth/register')
            .field('username', user.username)
            .field('email', user.email)
            .field('password', user.password);

        const updated = await request(app)
            .put('/api/auth/me')
            .set('Authorization', `Bearer ${registered.body.token}`)
            .attach('avatarFile', Buffer.from('fake-image-data'), {
                filename: 'new-avatar.jpg',
                contentType: 'image/jpeg',
            });

        expect(updated.status).toBe(200);
        expect(updated.body.avatarUrl).toMatch(/^https:\/\/example\.com\/.+\.jpg$/);
    });
});
