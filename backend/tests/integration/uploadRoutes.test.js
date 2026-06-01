import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../server';
import prisma from '../../prisma/prismaClient';

// Mock supabase storage client
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

describe('Upload + Delete flow', () => {
    let token = '';
    let testUser;

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

    beforeEach(async () => {
        // Injektoi mock client suoraan — ohittaa example.supabase.co guardin
        const uploadRoutes = require('../../routes/uploadRoutes');
        uploadRoutes.setSupabaseClient(mockSupabaseClient);

        testUser = uniqueUser();
        const reg = await request(app).post('/api/auth/register').send(testUser);
        token = reg.body.token;
    });

    afterEach(async () => {
        // Nollaa mock client
        const uploadRoutes = require('../../routes/uploadRoutes');
        uploadRoutes.setSupabaseClient(null);

        await prisma.song.deleteMany({ where: { user: { email: testUser.email } } }).catch(() => {});
        await prisma.user.deleteMany({ where: { email: testUser.email } }).catch(() => {});
    });

    it('uploads a song (multipart) and deletes it', async () => {
        const audioBuffer = Buffer.from('RIFF....');
        const uploadRes = await request(app)
            .post('/api/uploads')
            .set('Authorization', `Bearer ${token}`)
            .field('title', 'Upload Test')
            .field('artist', 'Uploader')
            .attach('audioFile', audioBuffer, { filename: 'test.mp3', contentType: 'audio/mpeg' });

        expect(uploadRes.status).toBe(201);
        expect(uploadRes.body).toHaveProperty('id');

        const songId = uploadRes.body.id;
        const delRes = await request(app).delete(`/api/songs/${songId}`).set('Authorization', `Bearer ${token}`);
        expect([200, 204]).toContain(delRes.status);
    }, 20000);

    it('rejects upload when title/artist missing', async () => {
        const audioBuffer = Buffer.from('RIFF....');
        const res = await request(app)
            .post('/api/uploads')
            .set('Authorization', `Bearer ${token}`)
            .attach('audioFile', audioBuffer, { filename: 'test.mp3', contentType: 'audio/mpeg' });

        expect(res.status).toBe(400);
    });

    it('rejects upload when audio missing', async () => {
        const res = await request(app)
            .post('/api/uploads')
            .set('Authorization', `Bearer ${token}`)
            .field('title', 'NoAudio')
            .field('artist', 'NoAudio');

        expect(res.status).toBe(400);
    });

    it('rejects invalid audio mimetype', async () => {
        const audioBuffer = Buffer.from('NOTMP3');
        const res = await request(app)
            .post('/api/uploads')
            .set('Authorization', `Bearer ${token}`)
            .field('title', 'BadMime')
            .field('artist', 'BadMime')
            .attach('audioFile', audioBuffer, { filename: 'test.wav', contentType: 'audio/wav' });

        expect(res.status).toBe(400);
    });

    it('rejects invalid image mimetype', async () => {
        const audioBuffer = Buffer.from('RIFF....');
        const imgBuffer = Buffer.from('NOTIMG');
        const res = await request(app)
            .post('/api/uploads')
            .set('Authorization', `Bearer ${token}`)
            .field('title', 'BadImg')
            .field('artist', 'BadImg')
            .attach('audioFile', audioBuffer, { filename: 'test.mp3', contentType: 'audio/mpeg' })
            .attach('imageFile', imgBuffer, { filename: 'img.bmp', contentType: 'image/bmp' });

        expect(res.status).toBe(400);
    });
});
