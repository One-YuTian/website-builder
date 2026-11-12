import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
let source='';for await(const chunk of process.stdin)source+=chunk;
try {
  const input=JSON.parse(source);
  const child=spawn(process.execPath,[fileURLToPath(new URL('../../../dist/server/cli.js',import.meta.url))],{stdio:['pipe','inherit','inherit'],env:process.env});
  child.once('error',error=>{console.error(error.message);process.exitCode=1;});
  child.once('exit',code=>process.exitCode=code||0);
  child.stdin.end(JSON.stringify({...input,mode:input.mode||input.action||'import',action:'import_products'}));
} catch(error) { console.error(error.message);process.exitCode=1; }
