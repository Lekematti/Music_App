import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

describe('Upload Diagnostics route', () => {
    let diagnostics;
    let app;

    beforeEach(() => {
        vi.resetModules();
        delete process.env.SUPABASE_URL;
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;
        diagnostics = require('../../routes/uploadDiagnostics');
        diagnostics.setSupabaseClient(null);
        app = express();
        app.use('/api/uploads/diagnostics', diagnostics);
    });

    afterEach(() => {
        diagnostics.setSupabaseClient(null);
        delete process.env.SUPABASE_URL;
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    });

    it('returns not configured when SUPABASE env not present', async () => {
        const res = await request(app).get('/api/uploads/diagnostics');
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(false);
        expect(res.body.message).toMatch(/not configured/i);
    });

    it('returns buckets when client available and listBuckets succeeds', async () => {
        diagnostics.setSupabaseClient({
            storage: {
                listBuckets: async () => ({ data: [{ name: 'songs' }], error: null }),
            },
        });

        const res = await request(app).get('/api/uploads/diagnostics');
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
        expect(Array.isArray(res.body.buckets)).toBe(true);
        expect(res.body.buckets).toContain('songs');
    });

    it('returns ok:false when listBuckets returns an error', async () => {
        diagnostics.setSupabaseClient({
            storage: {
                listBuckets: async () => ({ data: null, error: { message: 'listing failed' } }),
            },
        });

        const res = await request(app).get('/api/uploads/diagnostics');
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(false);
        expect(String(res.body.message).toLowerCase()).toMatch(/listing buckets failed/);
    });

    it('returns ok:false when listBuckets throws an exception', async () => {
        diagnostics.setSupabaseClient({
            storage: {
                listBuckets: async () => { throw new Error('boom'); },
            },
        });

        const res = await request(app).get('/api/uploads/diagnostics');
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(false);
        expect(String(res.body.message).toLowerCase()).toMatch(/listing buckets failed|operation failed/);
    });
});