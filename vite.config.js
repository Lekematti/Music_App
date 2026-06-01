import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: './frontend',
  envDir: resolve(__dirname),
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'frontend/index.html'),
        login: resolve(__dirname, 'frontend/pages/login.html'),
        register: resolve(__dirname, 'frontend/pages/register.html'),
        profile: resolve(__dirname, 'frontend/pages/profile.html'),
        song: resolve(__dirname, 'frontend/pages/song.html'),
        search: resolve(__dirname, 'frontend/pages/search.html'),
        upload: resolve(__dirname, 'frontend/pages/upload.html'),
        settings: resolve(__dirname, 'frontend/pages/settings.html'),
        top10: resolve(__dirname, 'frontend/pages/top10.html'),
        'new-uploads': resolve(__dirname, 'frontend/pages/new-uploads.html'),
        'past-uploads': resolve(__dirname, 'frontend/pages/past-uploads.html'),
      }
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});