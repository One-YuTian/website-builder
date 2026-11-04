import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: 'src/playground',
  base: './',
  publicDir: false,
  build: { target: 'es2022', outDir: '../../public/playground', emptyOutDir: true, rollupOptions: { input: { index: fileURLToPath(new URL('./src/playground/index.html', import.meta.url)), frame: fileURLToPath(new URL('./src/playground/frame.html', import.meta.url)) } } },
});
