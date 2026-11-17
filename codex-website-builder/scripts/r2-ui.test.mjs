import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {chromium} from '@playwright/test';
import {r2Fixture,testR2Config} from './r2-test-support.mjs';
const f=await r2Fixture(),client=new Client({name:'r2-ui-test',version:'1'});let browser,host;const externalPreviews=[];
const provision=spawnSync(process.execPath,['scripts/provision-r2.mjs'],{env:{...process.env,WEBSITE_BUILDER_DATA_DIR:f.root},input:JSON.stringify(testR2Config),encoding:'utf8'});assert.equal(provision.status,0,provision.stderr);assert.ok(!(await readFile(join(f.root,'config/r2-config.json'),'utf8')).includes('mock-r2-secret'));
try{
 await client.connect(new StdioClientTransport({command:process.execPath,args:[resolve('dist/server/index.js')],env:{...process.env,WEBSITE_BUILDER_DATA_DIR:f.root,WEBSITE_BUILDER_PROJECT_ROOT:f.store.root,CODEX_THREAD_ID:'mock-thread'}}));
 const tools=(await client.listTools()).tools;assert.ok(!tools.some(tool=>/website_gitlab_|^website_deploy$|^website_settings_/.test(tool.name)));assert.ok(tools.some(tool=>tool.name==='website_r2_deploy'));
 const native=await client.callTool({name:'website_s3_settings_read',arguments:{}});assert.ok(!native.isError,JSON.stringify(native));assert.equal(native.structuredContent.layout[0].title,'S3配置');assert.equal(native.structuredContent.values.R2_ACCESS_KEY_ID,'••••••••');assert.equal(native.structuredContent.values.R2_SECRET_ACCESS_KEY,'••••••••');assert.ok(!JSON.stringify(native).includes('mock-r2-secret'));
 for(const [name,property] of Object.entries(native.structuredContent.schema.properties)){assert.equal(property.enum,undefined);assert.equal(property.type,'string');assert.equal(property.readOnly,true);};
 const unchanged=await client.callTool({name:'website_s3_settings_update',arguments:{set:{R2_BUCKET_NAME:'other',R2_SECRET_ACCESS_KEY:'changed'}}});assert.equal(unchanged.structuredContent.values.R2_BUCKET_NAME,'website');
 const resource=await client.readResource({uri:'ui://codex-website-builder/canvas'});
 host=createServer((_req,res)=>res.end('<!doctype html><style>body{margin:0}iframe{width:100vw;height:100vh;border:0}</style><iframe id="app"></iframe>'));await new Promise(resolve=>host.listen(0,'127.0.0.1',resolve));
 browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:960},permissions:['clipboard-read','clipboard-write']}),network=[];
 page.on('request',request=>{if(request.url().includes('r2.cloudflarestorage.com'))network.push(request.url());});
 await page.exposeFunction('serverTool',async params=>{
  if(params.name!=='website_control')return client.callTool(params);
  const input=params.arguments;assert.equal(input.type,'r2');const actor='ui:'+input.panel_id;
  try{if(input.action==='preview'){externalPreviews.push(f.r2.status(input.project_id).url);return {content:[],_meta:{control:{opened:true}}};}const value=input.action==='status'?f.r2.status(input.project_id):input.action==='cancel'?f.r2.cancel(input.project_id,actor):await f.r2.start(input.project_id,actor);return {content:[],_meta:{control:value}};}catch(error){return {isError:true,content:[{type:'text',text:error.message}]};}
 });
 await page.goto(`http://127.0.0.1:${host.address().port}`);
 await page.evaluate(html=>{addEventListener('message',async event=>{const request=event.data;if(!request?.jsonrpc||request.id===undefined)return;try{let result={};if(request.method==='ui/initialize')result={protocolVersion:'2026-01-26',hostInfo:{name:'Mock Codex',version:'1'},hostCapabilities:{serverTools:{},updateModelContext:{}},hostContext:{platform:'desktop',displayMode:'fullscreen'}};if(request.method==='tools/call')result=await window.serverTool(request.params);event.source.postMessage({jsonrpc:'2.0',id:request.id,result},'*');}catch(error){event.source.postMessage({jsonrpc:'2.0',id:request.id,error:{code:-32603,message:error.message}},'*');}});document.querySelector('#app').srcdoc=html;},resource.contents[0].text);
 const app=page.frameLocator('#app');await app.getByRole('button',{name:'返回主界面',exact:true}).click();assert.equal(await app.getByRole('button',{name:'插件配置',exact:true}).count(),0);
 await app.locator(`[data-project-id="${f.view.project.id}"] .project-open`).click();
 let release;f.state.hold=new Promise(resolve=>release=resolve);
 await app.getByRole('button',{name:'部署网站',exact:true}).click();const popup=app.getByRole('dialog',{name:'预览环境部署',exact:true});await popup.waitFor();await popup.getByText('上传 index.html',{exact:true}).waitFor();
 const button=await app.getByRole('button',{name:'部署网站',exact:true}).boundingBox(),bounds=await popup.boundingBox();assert.ok(bounds.x+bounds.width<button.x,'R2 popup is left of toolbar button');assert.equal(await page.locator('iframe').count(),1,'deployment is an internal popup');
 await page.waitForTimeout(650);assert.equal(await app.locator('.canvas-world').getAttribute('inert'),'');
 const denied=await client.callTool({name:'website_write',arguments:{thread_id:'mock-thread',project_id:f.view.project.id,files:[{path:'index.html',content:'bad'}]}});assert.ok(denied.isError);assert.match(denied.content[0].text,/禁止修改/);
 release();await popup.locator('input[aria-label="预览链接"]').waitFor();assert.equal(await popup.locator('input[aria-label="预览链接"]').inputValue(),`https://${f.view.project.id}.deploy.invalid`);assert.ok(await popup.locator('input[aria-label="预览链接"]').getAttribute('readonly')!==null);assert.ok(!(await popup.innerText()).includes('src 与云端'));await popup.getByRole('button',{name:'复制链接',exact:true}).click();await popup.getByRole('button',{name:'已复制',exact:true}).waitFor();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),`https://${f.view.project.id}.deploy.invalid`);await popup.getByRole('link',{name:`https://${f.view.project.id}.deploy.invalid`}).click();assert.deepEqual(externalPreviews,[`https://${f.view.project.id}.deploy.invalid`]);assert.equal(f.r2.status(f.view.project.id).status,'completed');
 await page.screenshot({path:join(f.root,'r2-deployment-popup.png')});await popup.getByRole('button',{name:'关闭部署面板'}).click();await popup.waitFor({state:'hidden'});await app.locator('.deployment-cover').waitFor({state:'hidden'});
 assert.deepEqual(network,[]);console.log('PASS: readonly masked S3 settings; legacy settings/MCP hidden; internal R2 popup left of toolbar, live progress, source write lock and verified result link; no real cloud requests');console.log('Screenshot: '+join(f.root,'r2-deployment-popup.png'));
}finally{if(browser)await browser.close();if(host)await new Promise(resolve=>host.close(resolve));await client.close();f.store.database.sql.close();}
