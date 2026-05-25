import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server';

describe('Server SPA fallback and API 404s', () => {
  it('GET unknown /api/* returns 404 JSON', async () => {
    const res = await request(app).get('/api/this-route-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Not Found');
  });

  it('POST to root path falls through to SPA fallback and returns 404 JSON', async () => {
    const res = await request(app).post('/');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Not Found');
  });

  it('GET non-api non-root path serves frontend index.html', async () => {
    const res = await request(app).get('/some-client-route');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toMatch(/<!doctype html>/i);
  });
});
