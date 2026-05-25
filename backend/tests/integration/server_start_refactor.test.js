import request from 'supertest';
import { it, expect } from 'vitest';

// This test starts the real HTTP server on an ephemeral port and closes it.
it('start() opens server on ephemeral port and responds to health check', async () => {
  const app = require('../../server');
  const server = app.start(0); // ephemeral port

  // wait for listening
  await new Promise(resolve => server.once('listening', resolve));
  const port = server.address().port;
  const res = await request(`http://127.0.0.1:${port}`).get('/api/health');
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('status', 'OK');

  server.close();
});
