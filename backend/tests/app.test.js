// Setup fake DB URL to allow Prisma to instantiate without errors
process.env.DATABASE_URL = "postgres://fake:fake@localhost:5432/fake";

import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock our own prismaClient
vi.mock('../prisma/prismaClient', () => {
    return {
        default: {},
        user: {},
        song: {}
    };
});

import app from '../server';

describe('Backend API Routes', () => {
  it('GET / should return a welcome message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Music App Backend Server' });
  });

  it('GET /api/health should return the application status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('GET /unknown-route should serve SPA (index.html)', async () => {
    const response = await request(app).get('/unknown-route');
    expect(response.status).toBe(200);
    expect(response.type).toMatch(/html/);
  });
});
