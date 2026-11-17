import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire,syncBuiltinESMExports} from 'node:module';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';

const require=createRequire(import.meta.url);
const esbuild=createRequire(require.resolve('tsup/package.json'))('esbuild');
const temp=await mkdtemp(join(tmpdir(),'template-random-test-'));
const original=crypto.randomInt;
try {
  await esbuild.build({entryPoints:[resolve('server/templates.ts')],outfile:join(temp,'templates.mjs'),bundle:true,platform:'node',format:'esm',target:'node22',logLevel:'silent'});
  const {readTemplates}=await import(pathToFileURL(join(temp,'templates.mjs')).href);
  const root=resolve('skills/website-builder');
  const catalog=JSON.parse(await readFile(join(root,'catalog.json'),'utf8'));
  const homes=catalog.filter(item=>item.category==='home');
  let index=0,calls=0;
  crypto.randomInt=max=>{assert.equal(max,homes.length);calls++;return index;};
  syncBuiltinESMExports();
  for(index=0;index<homes.length;index++) {
    const [result]=await readTemplates(root,{mode:'select',category:'home',brief:'same brief',usage:{[homes[index].id]:{projects:999}}});
    assert.equal(result.selected.id,homes[index].id,'every catalog Home is reachable, regardless of legacy usage');
    assert.equal(result.strategy,'uniform-random');
    assert.equal(result.poolSize,homes.length);
    assert.deepEqual(result.candidates,[{id:homes[index].id,summary:homes[index].summary}]);
  }
  index=0;
  const first=await readTemplates(root,{mode:'select',category:'home',brief:'fashion'});
  const second=await readTemplates(root,{mode:'select',category:'home',brief:'garden'});
  assert.deepEqual(first,second,'independent draws may repeat; brief/history do not exclude a Home');
  assert.equal(calls,homes.length+2,'one random draw per Home selection');
  const before=calls;
  const [shop]=await readTemplates(root,{mode:'select',category:'shop'});
  assert.equal(calls,before,'other component selections do not trigger a Home draw');
  assert.equal(shop.candidates.length,catalog.filter(item=>item.category==='shop').length);
  assert.ok(shop.candidates.every(item=>!('usage' in item)));
  crypto.randomInt=original;syncBuiltinESMExports();
  const [actual]=await readTemplates(root,{mode:'select',category:'home'});
  assert.ok(homes.some(item=>item.id===actual.selected.id));
  const cli=JSON.parse(execFileSync(process.execPath,['dist/server/cli.js'],{
    input:JSON.stringify({action:'templates',mode:'select',category:'home'}),encoding:'utf8',
    env:{...process.env,WEBSITE_BUILDER_DATA_DIR:join(temp,'data'),WEBSITE_BUILDER_PROJECT_ROOT:join(temp,'projects'),WEBSITE_BUILDER_SKILL_ROOT:root}
  }));
  assert.equal(cli[0].strategy,'uniform-random');
  assert.equal(cli[0].poolSize,homes.length);
  assert.ok(homes.some(item=>item.id===cli[0].selected.id),'built CLI returns a catalog Home');
  console.log(`PASS: all ${homes.length} Home templates reachable, independent repeats allowed, no usage statistics`);
} finally {
  crypto.randomInt=original;syncBuiltinESMExports();
  await rm(temp,{recursive:true,force:true});
}
