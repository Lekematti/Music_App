import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: './',
    environment: 'node',
    include: ['backend/tests/**/*.test.js', 'frontend/tests/**/*.test.js'],
    setupFiles: [
      'backend/tests/setupVitest.js',
      'backend/tests/_setup.js',
      'frontend/tests/setup.js',
      'backend/tests/setup.mjs'
    ],
    fileParallelism: false,
    threads: false,
    server: {
      deps: {
        // Force Vite to transform backend files instead of treating them as native CJS
        inline: [/backend/]
      }
    }
  },
});
