import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@omnistream/core':      path.resolve(__dirname, 'src/core'),
      '@omnistream/shell':     path.resolve(__dirname, 'src/shell'),
      '@omnistream/utube':     path.resolve(__dirname, 'src/products/u-tube'),
      '@omnistream/cinemorph': path.resolve(__dirname, 'src/products/cinemorph'),
      '@omnistream/shared':    path.resolve(__dirname, 'src/shared'),
      '@tests':                path.resolve(__dirname, 'tests'),
      '@':                     path.resolve(__dirname, '.'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/**/*.{test,spec}.{ts,tsx}',
    ],
    testTimeout: 15000,
  },
});
