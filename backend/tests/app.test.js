import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('Backend API Routes', () => {
  it('GET / pitäisi palauttaa tervehdysviesti', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Music App Backend Server' });
  });

  it('GET /api/health pitäisi palauttaa sovelluksen tila', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('Tuntematon reitti pitäisi palauttaa 404', async () => {
    const response = await request(app).get('/tuntematon-reitti');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not Found' });
  });
});
