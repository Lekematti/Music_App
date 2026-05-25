import { describe, it, expect, vi } from 'vitest';

describe('Server CORS config', () => {
  it('loads with CORS_ORIGIN set', async () => {
    vi.resetModules();
    vi.stubEnv('CORS_ORIGIN', 'http://example.com');
    // require server to execute CORS setup
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const app = require('../../server');
    expect(app).toBeTruthy();
  });

  it('loads with empty CORS_ORIGIN', async () => {
    vi.resetModules();
    vi.stubEnv('CORS_ORIGIN', '');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const app = require('../../server');
    expect(app).toBeTruthy();
  });
});
