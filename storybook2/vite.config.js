import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: false,
  build: { target: 'es2022', outDir: 'storybook-static/standalone', emptyOutDir: true },
});
