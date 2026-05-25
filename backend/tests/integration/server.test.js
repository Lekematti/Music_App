import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server';

describe('Server routes and SPA fallback', () => {
  it('GET / returns JSON message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('GET /api/health returns status OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });

  it('Unknown API route returns 404 JSON', async () => {
    const res = await request(app).get('/api/this-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('Non-API path serves index.html via SPA fallback', async () => {
    const res = await request(app).get('/some/random/path');
    // index.html should be served as HTML
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toMatch(/<!doctype html/i);
  });
});
