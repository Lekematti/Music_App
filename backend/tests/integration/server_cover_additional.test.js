import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

describe('server coverage additions', () => {
  it('start() starts server and sets _server', async () => {
    const app = require('../../server');
    // ensure not accidentally started
    if (app._server) {
      app._server.close();
      app._server = undefined;
    }

    app.start(0);
    expect(app._server).toBeDefined();
    // health endpoint should work
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);

    // cleanup
    app._server.close();
    app._server = undefined;
  });

  it('startCallback logs server address when called with fake server', () => {
    const app = require('../../server');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const fakeServer = {
      address: () => ({ port: 12345 }),
    };
    app._startCallback(fakeServer);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('index CLI entry starts server when required', async () => {
    // emulate starting via CLI entrypoint
    process.env.FORCE_START = '1';
    // reload modules to ensure index picks up env
    vi.resetModules();
    require('../../index');
    const app = require('../../server');
    expect(app._server).toBeDefined();
    app._server.close();
    delete process.env.FORCE_START;
  });

  it('startCallback handles missing address gracefully', () => {
    const app = require('../../server');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const fakeServer = {
      address: () => null,
    };
    app._startCallback(fakeServer);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('error handler sends 500 JSON and logs stack', () => {
    const app = require('../../server');
    const spyErr = vi.spyOn(console, 'error').mockImplementation(() => {});
    const req = {};
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    const next = vi.fn();
    const err = new Error('cover-me');

    app._errorHandler(err, req, res, next);
    expect(spyErr).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalled();
    spyErr.mockRestore();
  });
});
