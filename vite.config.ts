import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: './client',
  publicDir: '../public',
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
  server: {
    port: 3002,
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
    },
  },
});
