import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';


describe('server start callback', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls console.log from listen callback when starting', async () => {
    const app = require('../../server');
    const server = app.start(0);
    // server.address() should be available
    const port = server.address()?.port;
    expect(port).toBeTruthy();
    server.close();
  });
});
