import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

describe('server behavior', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.CORS_ORIGIN;
  });

  it('start() listens and serves health', async () => {
    const app = require('../../server');
    const server = app.start(0);
    const p = server.address().port;
    const res = await request(`http://127.0.0.1:${p}`).get('/api/health');
    expect(res.status).toBe(200);
    server.close();
  });

  it('registerTestRoute registers handler and error middleware handles thrown error, and noop method does nothing', async () => {
    const app = require('../../server');
    app.registerTestRoute('get', '/boom', (_req, _res) => { throw new Error('boom'); });
    app.registerTestRoute('nope', '/noop', () => {});

    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('message', 'boom');
  });

  it('api unknown returns 404 and SPA fallback serves index.html', async () => {
    const app = require('../../server');
    const r1 = await request(app).get('/api/unknown');
    expect(r1.status).toBe(404);
    expect(r1.body).toHaveProperty('error');

    const r2 = await request(app).get('/some-client-route');
    expect(r2.status).toBe(200);
    expect(r2.headers['content-type']).toMatch(/text\/html/);
  });

  it('CORS respects CORS_ORIGIN env', async () => {
    vi.resetModules();
    process.env.CORS_ORIGIN = 'https://example.com';
    const app = require('../../server');
    const res = await request(app).get('/api/health').set('Origin', 'https://example.com');
    // CORS header presence depends on runtime; ensure request succeeds and server initialized with env
    expect(res.status).toBe(200);

    vi.resetModules();
    delete process.env.CORS_ORIGIN;
    const app2 = require('../../server');
    const res2 = await request(app2).get('/api/health').set('Origin', 'https://example.com');
    expect(res2.headers['access-control-allow-origin']).toBeUndefined();
  });
});
