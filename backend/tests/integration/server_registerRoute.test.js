import { it, expect } from 'vitest';

it('registerTestRoute no-op when method missing', () => {
  const app = require('../../server');
  // calling with an unknown method should not throw and should be a no-op
  expect(() => app.registerTestRoute('nope', '/__test/noop', () => {})).not.toThrow();
});
