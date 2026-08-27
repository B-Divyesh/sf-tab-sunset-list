import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: resolve(import.meta.dirname, 'site'),
  publicDir: resolve(import.meta.dirname, 'public/site'),
  build: {
    target: 'es2022',
    outDir: resolve(import.meta.dirname, 'dist/site'),
    emptyOutDir: true,
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'site/index.html'),
        privacy: resolve(import.meta.dirname, 'site/privacy/index.html'),
        terms: resolve(import.meta.dirname, 'site/terms/index.html'),
      },
    },
  },
});
