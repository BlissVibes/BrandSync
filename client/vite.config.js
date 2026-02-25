import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For GitHub Pages, set base to your repo name: '/BrandSync/'
// For Vercel or local dev, use '/'
const base = process.env.VITE_BASE_URL || '/';

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
