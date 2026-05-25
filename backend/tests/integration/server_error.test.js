import { describe, it, expect } from 'vitest';
import request from 'supertest';

describe('Server error handler', () => {
  it('returns 500 JSON from error handler middleware', async () => {
    const app = require('../../server');

    // register a test route that throws before SPA fallback
    app.registerTestRoute('get', '/__test/error', (req, res, next) => {
      next(new Error('test-error'));
    });

    const res = await request(app).get('/__test/error');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Internal Server Error');
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/test-error/);
  });
});
