import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import request from 'supertest';
// Note: we must mock supabase before importing the server so routes use the mocked client

// We'll mock @supabase/supabase-js to control the download behavior.
// Use a mutable implementation so tests can override it in beforeEach.
let createClientImpl = () => ({
  storage: {
    from: () => ({
      download: async () => ({ data: { arrayBuffer: async () => new ArrayBuffer(0) }, error: null }),
    }),
  },
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => createClientImpl(),
}));

let app;
beforeAll(async () => {
  const mod = await import('../../server.js');
  app = mod.default || mod;
});

describe('Media route', () => {
  const songBuffer = Buffer.alloc(5000, 0x61); // 5KB of 'a'

  beforeEach(() => {
    // Ensure env present so route constructs client normally
    process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key';

    // Override the module mock to return our buffer for downloads
    // Replace createClientImpl to return a storage client that serves our buffer
    createClientImpl = () => ({
      storage: {
        from: () => ({
          download: async (objectPath) => ({
            data: { arrayBuffer: async () => songBuffer.buffer },
            error: null,
          }),
        }),
      },
    });

    // Sanity check the mocked client returns the expected buffer
    // Use our local factory to create the mocked client instance
    const client = createClientImpl();
    // Inject the mocked client into the media route so the route uses our mock
    const mediaRoutes = require('../../routes/mediaRoutes');
    mediaRoutes.setSupabaseClient(client);

    return client.storage.from('songs').download('some/path').then(r => {
      if (typeof r?.data?.arrayBuffer !== 'function') {
        throw new TypeError('Mocked supabase download did not return expected shape');
      }
      return r.data.arrayBuffer().then(ab => {
        if (ab.byteLength !== songBuffer.length) {
          throw new Error('Mocked supabase buffer length mismatch');
        }
      });
    });
  });

  it('returns 400 when bucket or path missing', async () => {
    const res = await request(app).get('/api/media');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/bucket and path are required/);
  });

  it('returns full file with correct headers (200)', async () => {
    const res = await request(app)
      .get('/api/media')
      .query({ bucket: 'songs', path: 'some/path/song.mp3' })
      .buffer(true)
      .parse((res, callback) => { res.setEncoding('binary'); res.data = ''; res.on('data', c => res.data += c); res.on('end', () => callback(null, Buffer.from(res.data, 'binary'))); });

    expect(res.status).toBe(200);
    expect(res.headers['accept-ranges']).toBe('bytes');
    expect(res.headers['content-type']).toMatch(/audio\/mpeg/);
    expect(Number(res.headers['content-length'])).toBe(songBuffer.length);
    expect(res.body.length).toBe(songBuffer.length);
  });

  it('returns partial content (206) when Range header provided', async () => {
    // request bytes 1000-1999
    const res = await request(app)
      .get('/api/media')
      .set('Range', 'bytes=1000-1999')
      .query({ bucket: 'songs', path: 'some/path/song.mp3' })
      .buffer(true)
      .parse((res, callback) => { res.setEncoding('binary'); res.data = ''; res.on('data', c => res.data += c); res.on('end', () => callback(null, Buffer.from(res.data, 'binary'))); });

    expect(res.status).toBe(206);
    expect(res.headers['content-range']).toBeTruthy();
    // Content-Length should be 1000 (from 1000 to 1999 inclusive)
    expect(Number(res.headers['content-length'])).toBe(1000);
    expect(res.body.length).toBe(1000);
  });

  it('ignores malformed Range header and returns full file', async () => {
    const res = await request(app)
      .get('/api/media')
      .set('Range', 'bytes=bad-range')
      .query({ bucket: 'songs', path: 'some/path/song.mp3' })
      .buffer(true)
      .parse((res, callback) => { res.setEncoding('binary'); res.data = ''; res.on('data', c => res.data += c); res.on('end', () => callback(null, Buffer.from(res.data, 'binary'))); });

    expect(res.status).toBe(200);
    expect(Number(res.headers['content-length'])).toBe(songBuffer.length);
    expect(res.body.length).toBe(songBuffer.length);
  });

  it('returns correct content-type for covers png', async () => {
    const res = await request(app)
      .get('/api/media')
      .query({ bucket: 'covers', path: 'some/path/image.png' })
      .buffer(true)
      .parse((res, callback) => { res.setEncoding('binary'); res.data = ''; res.on('data', c => res.data += c); res.on('end', () => callback(null, Buffer.from(res.data, 'binary'))); });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/png/);
    expect(Number(res.headers['content-length'])).toBe(songBuffer.length);
  });

  it('returns correct content-type for covers webp', async () => {
    const res = await request(app)
      .get('/api/media')
      .query({ bucket: 'covers', path: 'some/path/image.webp' })
      .buffer(true)
      .parse((res, callback) => { res.setEncoding('binary'); res.data = ''; res.on('data', c => res.data += c); res.on('end', () => callback(null, Buffer.from(res.data, 'binary'))); });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/webp/);
  });

  it('returns octet-stream for unknown bucket', async () => {
    const res = await request(app)
      .get('/api/media')
      .query({ bucket: 'misc', path: 'some/path/file.bin' })
      .buffer(true)
      .parse((res, callback) => { res.setEncoding('binary'); res.data = ''; res.on('data', c => res.data += c); res.on('end', () => callback(null, Buffer.from(res.data, 'binary'))); });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/octet-stream/);
  });

});
