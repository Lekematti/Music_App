import { describe, it, expect } from 'vitest';
import request from 'supertest';
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

  it('GET /unknown-route should return 404', async () => {
    const response = await request(app).get('/unknown-route');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not Found' });
  });
});
