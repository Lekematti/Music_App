import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: './',
    // We define this as 'node' by default. We can override it in test files with
    // /* @vitest-environment jsdom */ at the top of the file for DOM simulation.
    environment: 'node',
  },
});
