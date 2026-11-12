import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const isolated = await mkdtemp(join(tmpdir(), 'website-persistence-'));
const userData = join(isolated, 'user-data');
const env = { ...process.env, WEBSITE_BUILDER_DATA_DIR: userData, CODEX_THREAD_ID: 'persistent-thread' };
delete env.WEBSITE_BUILDER_PROJECT_ROOT;
delete env.WEBSITE_BUILDER_ROOT;
delete env.WEBSITE_BUILDER_SKILL_ROOT;
const installs = [];
for (const version of ['old-version', 'new-version']) {
  const root = join(isolated, version);
  await mkdir(root);
  for (const path of ['dist', 'mcp.json', 'package.json']) await cp(resolve(path), join(root, path), { recursive: true });
  installs.push(root);
}
const call = (root, input, overrides = {}) => JSON.parse(execFileSync(process.execPath, [join(root, 'dist/server/cli.js')], {
  cwd: isolated, env: { ...env, ...overrides }, input: JSON.stringify(input), encoding: 'utf8',
}));
const first = call(installs[0], { action: 'open', name: 'Persistent project', pages: [{ path: 'index.html', title: 'Home' }] });
assert.equal(first.directory, join(userData, 'project', first.project_id));
assert.equal(first.metadata_directory, join(userData, '.builder-state', 'projects', first.project_id));
await writeFile(join(first.directory, 'index.html'), '<!doctype html><html><body>Preserved website</body></html>');
await writeFile(join(first.metadata_directory, 'notes.json'), '{"preserve":true}');
const upgraded = call(installs[1], { action: 'open' });
assert.equal(upgraded.project_id, first.project_id);
assert.equal(upgraded.directory, first.directory);
assert.match(await readFile(join(upgraded.directory, 'index.html'), 'utf8'), /Preserved website/);
assert.equal(await readFile(join(upgraded.metadata_directory, 'notes.json'), 'utf8'), '{"preserve":true}');
assert.ok((await stat(join(userData,'db','website-builder.sqlite'))).isFile());
const deleted=call(installs[0],{action:'projects',mode:'delete',panel_id:'persistent-panel',project_id:first.project_id});
assert.equal(deleted.page,'home');
const afterRestart=call(installs[1],{action:'projects',mode:'list'});
assert.ok(!afterRestart.projects.some(project=>project.id===first.project_id),'legacy JSON must not resurrect a tombstone after restarting');
call(installs[1],{action:'projects',mode:'restore',panel_id:'persistent-panel',project_id:first.project_id});
const restored=call(installs[0],{action:'open',project_id:first.project_id});
assert.equal(restored.project_id,first.project_id);
assert.match(await readFile(join(restored.directory,'index.html'),'utf8'),/Preserved website/);
assert.ok((await stat(join(userData, '.builder-state', 'active.json'))).isFile());
for (const root of installs) await assert.rejects(stat(join(root, 'project')), { code: 'ENOENT' });
const custom = call(installs[1], { action: 'open' }, { WEBSITE_BUILDER_PROJECT_ROOT: join(isolated, 'custom', 'project') });
assert.ok(custom.directory.startsWith(join(isolated, 'custom', 'project')));
assert.notEqual(custom.project_id, first.project_id);
// The standard per-user data location also remains stable without a plugin override.
if (process.platform !== 'win32') {
  const defaults = call(installs[1], { action: 'open' }, { WEBSITE_BUILDER_DATA_DIR: '', XDG_DATA_HOME: join(isolated, 'xdg-data') });
  assert.equal(defaults.directory, join(isolated, 'xdg-data', 'codex-website-builder', 'project', defaults.project_id));
}
console.log('PASS: separate installed versions reuse project files, metadata and thread bindings; custom root and user-data defaults');
// Simulate a plugin cache upgrade: default global data imports an older sibling cache.
if (process.platform !== 'win32') {
  const cache=join(isolated,'cache','codex-website-builder');
  const old=join(cache,'0.0.1'),next=join(cache,'0.0.2');
  await mkdir(old,{recursive:true});await mkdir(next,{recursive:true});
  for(const path of ['dist','mcp.json','package.json'])await cp(resolve(path),join(next,path),{recursive:true});
  await cp(resolve('package.json'),join(old,'package.json'));
  const legacyId='abcd-abcd-abcd-abcd';
  await mkdir(join(old,'project',legacyId),{recursive:true});
  await writeFile(join(old,'project',legacyId,'index.html'),'<html><body>Legacy cache website</body></html>');
  await writeFile(join(old,'project',legacyId,'.website-builder.json'),JSON.stringify({id:legacyId,name:'Old cache project',brief:'',language:'en',revision:'legacy',updatedAt:new Date().toISOString(),pages:[]}));
  await mkdir(join(isolated,'migration-data','codex-website-builder','db'),{recursive:true});
  await writeFile(join(isolated,'migration-data','codex-website-builder','db','migration.lock'),'99999999');
  const restoredList=call(next,{action:'projects',mode:'list'},{WEBSITE_BUILDER_DATA_DIR:'',XDG_DATA_HOME:join(isolated,'migration-data')});
  assert.ok(restoredList.projects.some(project=>project.id===legacyId));
  const migrated=join(isolated,'migration-data','codex-website-builder','project',legacyId,'index.html');
  assert.equal(await readFile(migrated,'utf8'),await readFile(join(old,'project',legacyId,'index.html'),'utf8'));
  await writeFile(migrated,'Newer global website');
  call(next,{action:'projects',mode:'list'},{WEBSITE_BUILDER_DATA_DIR:'',XDG_DATA_HOME:join(isolated,'migration-data')});
  assert.equal(await readFile(migrated,'utf8'),'Newer global website','migration must never overwrite a newer global project');
  console.log('PASS: automatic legacy cache migration preserves old files and does not overwrite global data');
}
