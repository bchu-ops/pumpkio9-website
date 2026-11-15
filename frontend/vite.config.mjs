import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');

export default defineConfig({
  // GitHub Pages serves the site at /pumpkio9-website/.
  base: '/pumpkio9-website/',
  // The repo keeps one .env at its root. Vite only exposes VITE_* values to the site.
  envDir: repo,
  plugins: [react()],
  resolve: {
    // Product pages live in ../products/<name>/web and are imported as @products/<name>/web/...
    alias: { '@products': path.join(repo, 'products') },
    // Product code sits outside this folder, so make its packages resolve from frontend/node_modules.
    dedupe: ['react', 'react-dom', 'react-router-dom', '@testing-library/react', '@testing-library/user-event'],
  },
  server: {
    port: 3000,
    fs: { allow: [repo] },
  },
  build: {
    outDir: 'build',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.js'],
    dir: repo,
    include: ['frontend/src/**/*.test.{js,jsx}', 'products/*/web/**/*.test.{js,jsx}'],
  },
});
