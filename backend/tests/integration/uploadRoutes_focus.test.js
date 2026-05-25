import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

describe('Focused uploadRoutes tests', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    // clear any env changes
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
        // clear any env changes
        delete process.env.JWT_SECRET;
        delete process.env.SUPABASE_URL;
  });

  it('returns 500 when supabase is not configured', async () => {
    // ensure env not set
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    // mock protect to inject user
        // use a real JWT token so protect middleware authorizes the request
        process.env.JWT_SECRET = 'test-secret';
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ email: 'a@b.com' }, process.env.JWT_SECRET);

        const router = require('../../routes/uploadRoutes');
        const app = express();
        app.use(router);

    const res = await request(app).post('/').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('message', 'Supabase storage is not configured');
  });

  it('returns 400 when title/artist are missing', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'key';

    // inject mocked supabase client and mocked prisma
    const mockSupabase = { storage: { from: (bucket) => ({
      upload: async () => ({ error: null }),
      getPublicUrl: (p) => ({ data: { publicUrl: `https://cdn/${p}` } }),
    }) } };

    // patch prisma after requiring the router below
    // use a real JWT token so protect middleware authorizes the request
    process.env.JWT_SECRET = 'test-secret';
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ email: 'a@b.com' }, process.env.JWT_SECRET);

    const router = require('../../routes/uploadRoutes');
    const prisma = require('../../prisma/prismaClient');
    prisma.user = { findUnique: async () => ({ id: 'u1' }) };
    prisma.song = { create: async ({ data }) => ({ id: 's1', ...data }) };
    router.setSupabaseClient(mockSupabase);
    const app = express();
    app.use(express.json());
    app.use(router);

    const res = await request(app)
      .post('/')
      .set('Authorization', `Bearer ${token}`)
      .attach('audioFile', Buffer.from('audio'), { filename: 'song.mp3', contentType: 'audio/mpeg' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Title and artist are required fields');
  });

  it('returns 400 when audio file missing', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'key';

    const mockSupabase = { storage: { from: () => ({ upload: async () => ({ error: null }) }) } };

    // patch prisma after requiring the router below
    // use a real JWT token so protect middleware authorizes the request
    process.env.JWT_SECRET = 'test-secret';
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ email: 'a@b.com' }, process.env.JWT_SECRET);

    const router = require('../../routes/uploadRoutes');
    const prisma = require('../../prisma/prismaClient');
    prisma.user = { findUnique: async () => ({ id: 'u1' }) };
    prisma.song = { create: async ({ data }) => ({ id: 's1', ...data }) };
    router.setSupabaseClient(mockSupabase);
    const app = express();
    app.use(express.json());
    app.use(router);

    const res = await request(app)
      .post('/')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'My Song')
      .field('artist', 'Me');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Audio file is required');
  });

  it('returns 502 when audio upload fails', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'key';

    const mockSupabase = { storage: { from: (bucket) => ({
      upload: async () => ({ error: { message: 'boom' } }),
      getPublicUrl: (p) => ({ data: { publicUrl: `https://cdn/${p}` } }),
    }) } };

    // patch prisma after requiring the router below
    // use a real JWT token so protect middleware authorizes the request
    process.env.JWT_SECRET = 'test-secret';
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ email: 'a@b.com' }, process.env.JWT_SECRET);

    const router = require('../../routes/uploadRoutes');
    const prisma = require('../../prisma/prismaClient');
    prisma.user = { findUnique: async () => ({ id: 'u1' }) };
    prisma.song = { create: async ({ data }) => ({ id: 's1', ...data }) };
    router.setSupabaseClient(mockSupabase);
    const app = express();
    app.use(express.json());
    app.use(router);

    const res = await request(app)
      .post('/')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'My Song')
      .field('artist', 'Me')
      .attach('audioFile', Buffer.from('audio'), { filename: 'song.mp3', contentType: 'audio/mpeg' });

    expect(res.status).toBe(502);
    expect(res.body.message).toMatch(/Audio upload failed/);
  });

  it('creates song successfully with image', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'key';

    const mockSupabase = { storage: { from: (bucket) => ({
      upload: async () => ({ error: null }),
      getPublicUrl: (p) => ({ data: { publicUrl: `https://cdn/${p}` } }),
    }) } };

    // patch prisma after requiring the router below
    // use a real JWT token so protect middleware authorizes the request
    process.env.JWT_SECRET = 'test-secret';
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ email: 'a@b.com' }, process.env.JWT_SECRET);

    const router = require('../../routes/uploadRoutes');
    const prisma = require('../../prisma/prismaClient');
    prisma.user = { findUnique: async () => ({ id: 'u1' }) };
    prisma.song = { create: async ({ data }) => ({ id: 's1', ...data }) };
    router.setSupabaseClient(mockSupabase);
    const app = express();
    app.use(express.json());
    app.use(router);

    const res = await request(app)
      .post('/')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'My Song')
      .field('artist', 'Me')
      .attach('audioFile', Buffer.from('audio'), { filename: 'song.mp3', contentType: 'audio/mpeg' })
      .attach('imageFile', Buffer.from('img'), { filename: 'cover.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('title', 'My Song');
  });
});
