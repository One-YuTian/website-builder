import { cp } from 'node:fs/promises';
await cp(new URL('../assets/vendor/', import.meta.url), new URL('../dist/vendor/', import.meta.url), { recursive: true });

// Copy the complete browser driver so the installed bundle has no pnpm symlink dependency.
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
const require = createRequire(import.meta.url);
const testRequire = createRequire(require.resolve('@playwright/test'));
const playwrightRequire = createRequire(testRequire.resolve('playwright'));
await cp(dirname(playwrightRequire.resolve('playwright-core/package.json')), new URL('../dist/runtime/playwright-core/', import.meta.url), {recursive:true});

// Prettier is vendored standalone files, never an npm runtime dependency.
await cp(new URL('../assets/prettier/', import.meta.url), new URL('../dist/runtime/prettier/', import.meta.url), { recursive: true });
