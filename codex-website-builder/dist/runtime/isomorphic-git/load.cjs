const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { compileFunction } = require('node:vm');
// Official standalone UMD expects browser `self`; supply it without mutating globals.
compileFunction(readFileSync(join(__dirname, 'index.cjs'), 'utf8'), ['self', 'module', 'exports'])(globalThis, module, module.exports);
