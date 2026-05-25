import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

describe('uploadDiagnostics injection tests', () => {
  it('reports ok:true when listBuckets returns buckets via injected client', async () => {
    const diagnostics = require('../../routes/uploadDiagnostics');
    const app = express();
    // inject client
    diagnostics.setSupabaseClient({ storage: { listBuckets: async () => ({ data: [{ name: 'songs' }], error: null }) } });
    app.use('/api/uploads/diagnostics', diagnostics);

    const res = await request(app).get('/api/uploads/diagnostics');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.buckets)).toBe(true);
  });

  it('reports ok:false when injected client listBuckets returns error', async () => {
    const diagnostics = require('../../routes/uploadDiagnostics');
    const app = express();
    diagnostics.setSupabaseClient({ storage: { listBuckets: async () => ({ data: null, error: { message: 'nope' } }) } });
    app.use('/api/uploads/diagnostics', diagnostics);

    const res = await request(app).get('/api/uploads/diagnostics');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
  });

  it('reports ok:false when injected client listBuckets throws', async () => {
    const diagnostics = require('../../routes/uploadDiagnostics');
    const app = express();
    diagnostics.setSupabaseClient({ storage: { listBuckets: async () => { throw new Error('boom'); } } });
    app.use('/api/uploads/diagnostics', diagnostics);

    const res = await request(app).get('/api/uploads/diagnostics');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
  });
});
