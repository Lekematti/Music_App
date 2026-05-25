import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: './',
    environment: 'node',
    include: ['backend/tests/**/*.test.js', 'frontend/tests/**/*.test.js'],
    // Shared setup: general helpers, frontend fetch stub, backend DB setup
    setupFiles: [
      'backend/tests/setupVitest.js',
      'backend/tests/_setup.js',
      'frontend/tests/setup.js',
      'backend/tests/setup.mjs'
    ],
    fileParallelism: false,
    // Run tests in the main thread to avoid worker coverage temp-file races
    threads: false,
  },
});
