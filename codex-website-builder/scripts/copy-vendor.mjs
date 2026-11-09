import { cp } from 'node:fs/promises';
await cp(new URL('../assets/vendor/', import.meta.url), new URL('../dist/vendor/', import.meta.url), { recursive: true });
