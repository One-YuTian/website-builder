import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {loadGitLabFixture} from './gitlab-test-support.mjs';
const {R2Settings,fixture}=await loadGitLabFixture();
const f=await fixture();
try{
 const settings=new R2Settings(f.root,{R2_ACCOUNT_ID:'override-account',R2_BUCKET_NAME:'override-bucket',R2_ACCESS_KEY_ID:'override-key',R2_SECRET_ACCESS_KEY:'override-secret',R2_DEPLOY_HOST:'override.invalid'});
 const config=await settings.get();
 assert.equal(config.R2_BUCKET_NAME,'website');assert.equal(config.R2_DEPLOY_HOST,'1437257.xyz');
 assert.ok(/^[a-f0-9]{32}$/i.test(config.R2_ACCOUNT_ID),'fixed account ID is well formed');
 assert.ok(/^[a-f0-9]{32}$/i.test(config.R2_ACCESS_KEY_ID),'fixed access key is well formed');
 assert.ok(/^[a-f0-9]{64}$/i.test(config.R2_SECRET_ACCESS_KEY),'fixed signing secret is well formed');
 await mkdir(join(f.root,'config'),{recursive:true});await writeFile(join(f.root,'config/r2-config.json'),'{invalid legacy config');
 const unchanged=await settings.get();assert.ok(JSON.stringify(unchanged)===JSON.stringify(config),'legacy local config and environment cannot override bundled settings');
 config.R2_BUCKET_NAME='caller-change';assert.equal((await settings.get()).R2_BUCKET_NAME,'website');
 const visible=await settings.public();assert.equal(visible.R2_ACCESS_KEY_ID,'••••••••');assert.equal(visible.R2_SECRET_ACCESS_KEY,'••••••••');
 const ui=await readFile('dist/ui/index.html','utf8');
 assert.ok(!ui.includes(unchanged.R2_ACCESS_KEY_ID)&&!ui.includes(unchanged.R2_SECRET_ACCESS_KEY),'credentials remain server-only');
 assert.ok(!JSON.stringify(visible).includes(unchanged.R2_SECRET_ACCESS_KEY),'public settings must redact signing secret');
 console.log('PASS: fixed R2 configuration, ignored environment/legacy files, caller isolation and masked server-only credentials; no cloud requests');
}finally{f.store.database.sql.close();}
