import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import ts from 'typescript';

const source=await readFile('server/open-directory.ts','utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {openDirectory}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const directory=resolve('.');
await openDirectory(directory,'win32',(command,args,options)=>{
  assert.ok(command.toLowerCase().endsWith('powershell.exe'));assert.ok(args.includes('-STA'));assert.ok(args.includes('Hidden'));
  assert.equal(options.shell,false);assert.equal(options.windowsHide,true);assert.ok(options.env.WEBSITE_BUILDER_OPEN_DIRECTORY);
  assert.ok(!args.at(-1).includes(directory),'path is passed as data, not interpolated as shell code');
  const child=new EventEmitter();queueMicrotask(()=>{child.emit('spawn');child.emit('exit',0);});return child;
});
await assert.rejects(openDirectory(directory,'win32',()=>{
  const child=new EventEmitter();queueMicrotask(()=>child.emit('error',Error('ENOENT')));return child;
}),/无法打开项目目录/);
await assert.rejects(openDirectory(directory,'win32',()=>{
  const child=new EventEmitter();queueMicrotask(()=>child.emit('exit',3));return child;
}),/未允许切换到前台/);
const {windowsShellPath}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
assert.equal(windowsShellPath(String.raw`\\?\C:\Projects\项目 空格`),String.raw`C:\Projects\项目 空格`);
assert.equal(windowsShellPath(String.raw`\\?\UNC\server\share\folder`),String.raw`\\server\share\folder`);
for(const platform of ['darwin','linux']) {
  await openDirectory(directory,platform,command=>{assert.equal(command,platform==='darwin'?'open':'xdg-open');const child=new EventEmitter();queueMicrotask(()=>child.emit('exit',0));return child;});
  await assert.rejects(openDirectory(directory,platform,()=>{const child=new EventEmitter();queueMicrotask(()=>child.emit('exit',1));return child;}),/无法打开项目目录/);
}
await assert.rejects(openDirectory(resolve(directory,'missing-open-directory-fixture'),'win32',()=>{throw Error('must not launch');}));
console.log('PASS: Windows existing-window activation and shell-safe path/UNC handling; blocked activation/errors still fail; macOS/Linux exit handling retained');
