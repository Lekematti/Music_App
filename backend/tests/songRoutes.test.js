import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../server';
import prisma from '../prisma/prismaClient';

const uniqueUser = () => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    username: `testuser-${id}`,
    email: `test-${id}@example.com`,
    password: 'password123',
  };
};

describe('Song API Routes', () => {
    let token = '';
    let testUser;

    beforeEach(async () => {
        process.env.JWT_SECRET = 'testsecret';
        
        // Create test user
        testUser = uniqueUser();
        const res = await request(app).post('/api/auth/register').send(testUser);
        token = res.body.token;
    });

    afterEach(async () => {
        // Clean up test data to avoid test interference
        await prisma.song.deleteMany({
            where: {
                user: {
                    email: testUser.email
                }
            }
        });
        await prisma.user.deleteMany({
            where: {
                email: testUser.email
            }
        });
    });

    describe('GET /api/songs', () => {
        it('Should get all songs', async () => {
            const response = await request(app).get('/api/songs');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('POST /api/songs', () => {
        it('Should require authentication', async () => {
            const response = await request(app).post('/api/songs').send({
                title: 'No auth song',
                artist: 'Nobody',
                url: 'http://example.com/noauth.mp3'
            });
            // 401 unauthenticated
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Not authorized, token missing');
        });

        it('Should create a song when authenticated', async () => {
            const response = await request(app)
                .post('/api/songs')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'Test Song',
                    artist: 'Test Artist',
                    url: 'http://example.com/song.mp3'
                });
            
            expect(response.status).toBe(201);
            expect(response.body.title).toBe('Test Song');
            expect(response.body.artist).toBe('Test Artist');
        });

        it('Should return 400 if missing fields', async () => {
            const response = await request(app)
                .post('/api/songs')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'Test Song' // missing artist and url
                });
            
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('required');
        });
    });
});
