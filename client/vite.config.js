import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy /api requests to the Express backend during development.
    // This avoids CORS issues and means the frontend never holds secret keys.
    proxy: {
      '/api': {
        target:      'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../dist', // Production build outputs to tennis-academy/dist/
  },
});
