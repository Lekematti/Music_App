import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import prisma from '../../prisma/prismaClient';

const uniqueUser = () => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    username: `searchuser-${id}`,
    email: `search-${id}@example.com`,
    password: 'password123',
  };
};

describe('Song search API', () => {
  let app;

  beforeEach(() => {
    vi.resetModules();
    process.env.JWT_SECRET = 'testsecret';
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
    app = require('../../server');
  });

  afterEach(async () => {
    const users = await prisma.user.findMany({ where: { email: { contains: 'search-' } }, select: { id: true } }).catch(() => []);

    if (users.length > 0) {
      await prisma.song.deleteMany({ where: { userId: { in: users.map((user) => user.id) } } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: { in: users.map((user) => user.id) } } }).catch(() => {});
    }
  });

  it('filters songs by title or artist and prefers exact matches', async () => {
    const user = uniqueUser();
    await request(app).post('/api/auth/register').send(user);
    const userRecord = await prisma.user.findUnique({ where: { email: user.email } });

    await prisma.song.create({ data: { title: 'Summer Nights', artist: 'Midnight Echo', url: 'a.mp3', userId: userRecord.id } });
    await prisma.song.create({ data: { title: 'Winter Light', artist: 'Sunset Wave', url: 'b.mp3', userId: userRecord.id } });

    const titleMatch = await request(app).get('/api/songs?search=summer');
    expect(titleMatch.status).toBe(200);
    expect(titleMatch.body.length).toBe(1);
    expect(titleMatch.body[0].title).toBe('Summer Nights');

    const artistMatch = await request(app).get('/api/songs?search=sunset');
    expect(artistMatch.status).toBe(200);
    expect(artistMatch.body.length).toBe(1);
    expect(artistMatch.body[0].artist).toBe('Sunset Wave');

    const exactMatch = await request(app).get('/api/songs?search=Summer Nights');
    expect(exactMatch.status).toBe(200);
    expect(exactMatch.body).toHaveLength(1);
    expect(exactMatch.body[0].title).toBe('Summer Nights');
  });

  it('places the exact match first when broader matches also exist', async () => {
    const user = uniqueUser();
    await request(app).post('/api/auth/register').send(user);
    const userRecord = await prisma.user.findUnique({ where: { email: user.email } });

    await prisma.song.create({ data: { title: 'Sammalpää remix', artist: 'Partial Artist', url: 'partial.mp3', userId: userRecord.id, createdAt: new Date(Date.now() - 1000) } });
    await prisma.song.create({ data: { title: 'Sammalpää', artist: 'Exact Artist', url: 'exact.mp3', userId: userRecord.id, createdAt: new Date() } });

    const res = await request(app).get('/api/songs?search=sammalpää');
    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe('Sammalpää');
  });
});