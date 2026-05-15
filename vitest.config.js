import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    root: './',
    environment: 'node',
    include: ['backend/tests/**/*.test.js', 'frontend/tests/**/*.test.js'],
    setupFiles: ['backend/tests/setup.mjs'],
  },
});
