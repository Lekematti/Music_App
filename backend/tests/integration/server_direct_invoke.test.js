import { describe, it, expect, vi } from 'vitest';

describe('server direct invoke helpers', () => {
  it('startCallback logs with server address', () => {
    const app = require('../../server');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // mock server with address
    const mockServer = { address: () => ({ port: 12345 }) };
    app._startCallback(mockServer);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('errorHandler sends 500 and logs', () => {
    const app = require('../../server');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('direct');
    const res = {
      statusCalled: null,
      jsonCalled: null,
      status(code) { this.statusCalled = code; return this; },
      json(obj) { this.jsonCalled = obj; }
    };
    app._errorHandler(err, {}, res, () => {});
    expect(res.statusCalled).toBe(500);
    expect(res.jsonCalled).toHaveProperty('message', 'direct');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
