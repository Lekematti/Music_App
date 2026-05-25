import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';

describe('server error logging', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses console.error in error handler', async () => {
    const app = require('../../server');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // register a test route that throws
    app.registerTestRoute('get', '/force-error', () => { throw new Error('forced'); });

    const res = await request(app).get('/force-error');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('message', 'forced');
    expect(spy).toHaveBeenCalled();
  });
});
