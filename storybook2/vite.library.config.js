import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false,
  build: {
    target: 'es2022',
    outDir: 'public/library',
    emptyOutDir: true,
    lib: { entry: 'src/browser.js', name: 'ComponentLibraryBundle', formats: ['iife'], fileName: () => 'component-library.js' },
  },
});
