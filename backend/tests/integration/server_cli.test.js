import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('server CLI start branch', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('executes CLI entry and starts server', async () => {
    process.env.FORCE_START = '1';
    vi.resetModules();
    require('../../index');
    const app = require('../../server');
    expect(app._server).toBeDefined();
    app._server.close();
    delete process.env.FORCE_START;
  });
});
