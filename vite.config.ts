import { resolve } from 'node:path';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

import { tokenRootPlugin as rootPlugin } from './scripts/token-root-plugin.mjs';

export default defineConfig({
  root: resolve(import.meta.dirname, 'src/web'),
  base: './',
  plugins: [vue(), rootPlugin(import.meta.dirname)],
  build: {
    outDir: resolve(import.meta.dirname, 'dist/web'),
    emptyOutDir: true,
  },
});
