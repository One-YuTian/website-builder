import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['server/index.ts', 'server/cli.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  outDir: 'dist/server',
  clean: true,
  // Installed plugins cannot rely on pnpm's development symlinks.
  noExternal: [/.*/],
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
});
