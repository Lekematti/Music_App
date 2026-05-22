import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: './frontend',
  envDir: resolve(__dirname),
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});