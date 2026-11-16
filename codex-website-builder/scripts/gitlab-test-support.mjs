import {mkdtemp,mkdir,cp} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
export async function loadGitLabFixture(){
  const root=await mkdtemp(join(tmpdir(),'gitlab-harness-'));
  await mkdir(join(root,'server'),{recursive:true});await mkdir(join(root,'runtime'),{recursive:true});
  for(const name of ['isomorphic-git','prettier'])await cp(resolve('dist/runtime',name),join(root,'runtime',name),{recursive:true});
  const require=createRequire(import.meta.url),esbuild=createRequire(require.resolve('tsup/package.json'))('esbuild');
  await esbuild.build({entryPoints:[resolve('scripts/gitlab-fixture.ts')],outfile:join(root,'server/harness.mjs'),bundle:true,platform:'node',format:'esm',target:'node24',logLevel:'silent',banner:{js:"import {createRequire} from 'node:module';const require=createRequire(import.meta.url);"}});
  process.env.WEBSITE_BUILDER_SKILL_ROOT=resolve('skills/website-builder');
  return import(pathToFileURL(join(root,'server/harness.mjs')).href);
}
