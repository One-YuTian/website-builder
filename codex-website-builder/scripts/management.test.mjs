import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';

const root=await mkdtemp(join(tmpdir(),'website-management-'));
const env={...process.env,CODEX_THREAD_ID:'manager-thread',WEBSITE_BUILDER_DATA_DIR:root,WEBSITE_BUILDER_PROJECT_ROOT:join(root,'project'),WEBSITE_BUILDER_SKILL_ROOT:resolve('skills/website-builder')};
const globalEntry=process.argv.includes('--global-entry')||process.env.TEST_GLOBAL_ENTRY_NO_THREAD==='1';
if(globalEntry){delete env.CODEX_THREAD_ID;delete env.CODEX_SESSION_ID;}
const legacy='aaaa-bbbb-cccc-dddd';
await mkdir(join(root,'project',legacy),{recursive:true});
await writeFile(join(root,'project',legacy,'.website-builder.json'),JSON.stringify({id:legacy,name:'Legacy project',brief:'',language:'en',revision:'legacy',updatedAt:new Date().toISOString(),pages:[]}));
const client=new Client({name:'management-test',version:'1'});
const call=async(name,args)=>{const result=await client.callTool({name,arguments:args});assert.ok(!result.isError,JSON.stringify(result));return result;};
const json=async(name,args)=>JSON.parse((await call(name,args)).content[0].text);
const manage=args=>json('website_projects',{panel_id:'manager-panel',thread_id:'manager-thread',...args});
let browser,host;
try {
 await client.connect(new StdioClientTransport({command:process.execPath,args:[resolve('dist/server/index.js')],env}));
 assert.ok((await manage({action:'list'})).projects.some(project=>project.id===legacy));
 const first=await manage({action:'create',name:'Forest studio'});
 const second=await manage({action:'create',panel_id:'another-panel',thread_id:'another-thread',name:'Second project'});
 assert.equal((await json('website_panel_context',{thread_id:'manager-thread',panel_id:'manager-panel'})).project_id,first.project_id);
 assert.equal((await json('website_panel_context',{thread_id:'another-thread',panel_id:'another-panel'})).project_id,second.project_id);
 await manage({action:'home'});
 const home=await json('website_panel_context',{thread_id:'manager-thread',panel_id:'manager-panel'});
 assert.equal(home.page,'home');assert.ok(home.projects.length>=3);
 assert.equal((await json('website_panel_context',{thread_id:'another-thread',panel_id:'another-panel'})).project_id,second.project_id);
 await manage({action:'open',project_id:first.project_id});
 await json('website_project',{thread_id:'manager-thread',action:'plan',pages:[{path:'index.html',title:'Home'}]});
 const written=await json('website_write',{thread_id:'manager-thread',project_id:first.project_id,files:[{path:'index.html',content:'<!doctype html><html><head><title>Forest</title></head><body style="margin:0;background:#c9dac7"><h1>Forest studio</h1><div style="height:1800px">Sustainable spaces</div></body></html>'}]});
 assert.equal(written.pages[0].status,'ready');
 await manage({action:'open',thread_id:'thumbnail-thread',panel_id:'thumbnail-panel',project_id:first.project_id});
 const asset=join(root,'attachment.txt');await writeFile(asset,'Original session resource');
 const attached=await manage({action:'attach',project_id:first.project_id,source_path:asset});
 const resource=attached.resources.find(item=>item.name==='attachment.txt');assert.ok(resource);assert.equal(await readFile(resource.path,'utf8'),'Original session resource');
 const sql=new DatabaseSync(join(root,'db','website-builder.sqlite'));
 if(globalEntry){
   const unbound=args=>json('website_projects',{panel_id:'unbound-panel',...args});
   const before=sql.prepare('SELECT count(*) AS n FROM threads').get().n;
   assert.equal((await unbound({action:'list'})).thread_id,null);
   await unbound({action:'home'});
   assert.equal((await unbound({action:'open',project_id:first.project_id})).thread_id,null);
   assert.equal((await json('website_panel_context',{panel_id:'unbound-panel',thread_id:'manager-thread'})).project_id,first.project_id);
   const draft=await unbound({action:'create',name:'Global draft'});assert.equal(draft.thread_id,null);
   await unbound({action:'delete',project_id:draft.project_id});
   await unbound({action:'restore',project_id:draft.project_id});
   assert.equal(sql.prepare('SELECT count(*) AS n FROM threads').get().n,before,'unbound panels must not create fake chat bindings');
 }
 assert.equal(sql.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
 assert.ok(sql.prepare('SELECT * FROM project_sessions WHERE project_id=? AND thread_id=?').get(first.project_id,'manager-thread'));
 const appResource=await client.readResource({uri:'ui://codex-website-builder/canvas'});
 const html=appResource.contents[0].text;
 const bootstrap=JSON.parse(html.match(/window\.__WEBSITE_BUILDER__=(.*?);<\/script>/)[1]);
 // Native-host protocol harness forwards actual MCP tool calls; captures sends without posting to a real user chat.
 host=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><body style="margin:0"><iframe id="app" style="border:0;width:100vw;height:100vh"></iframe></body></html>');});
 await new Promise(resolve=>host.listen(0,'127.0.0.1',resolve));
 browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.exposeFunction('serverTool',async params=>{
   if(params.name==='website_projects'&&params.arguments.action==='folder')return {content:[],_meta:{manager:{directory:first.directory}}};
   return await client.callTool(params);
 });
 await page.goto(`http://127.0.0.1:${host.address().port}`);
 await page.evaluate(html=>{
   window.sent=[];window.contexts=[];window.folderCalls=[];
   window.addEventListener('message',async event=>{
     const request=event.data;if(!request?.jsonrpc||request.id===undefined)return;
     let result;
     try {
       if(request.method==='ui/initialize')result={protocolVersion:'2026-01-26',hostInfo:{name:'Test Codex',version:'26.1112.1'},hostCapabilities:{serverTools:{},updateModelContext:{},message:{text:{}}},hostContext:{displayMode:'fullscreen',platform:'desktop'}};
       else if(request.method==='tools/call'){if(request.params.arguments?.action==='folder')window.folderCalls.push(request.params);result=await window.serverTool(request.params);}
       else if(request.method==='ui/update-model-context'){window.contexts.push(request.params);result={};}
       else if(request.method==='ui/message'){window.sent.push(request.params);result={};}
       else result={};
       event.source.postMessage({jsonrpc:'2.0',id:request.id,result},'*');
     }catch(error){event.source.postMessage({jsonrpc:'2.0',id:request.id,error:{code:-32603,message:error.message}},'*');}
   });
   document.querySelector('#app').srcdoc=html;
 },html);
 const app=page.frameLocator('#app');
 await app.getByRole('heading',{name:'Website Builder',exact:true}).waitFor();
 await app.locator('.project-open').filter({hasText:'Forest studio'}).waitFor();
 assert.equal(await app.locator('.tool-rail').count(),0,'global entry opens the library, even with an active project');
 await app.getByLabel('搜索项目').fill('Forest');assert.equal(await app.locator('.project-row').count(),1);await app.getByLabel('搜索项目').fill('');
 await app.getByRole('button',{name:/Forest studio/}).first().click();
 await app.locator('.page-caption[data-ready="true"]').waitFor({timeout:30000});
 await app.getByRole('button',{name:'打开项目目录',exact:true}).click();
 await page.waitForFunction(()=>window.folderCalls.length===1);
 assert.equal((await page.evaluate(()=>window.folderCalls))[0].arguments.project_id,first.project_id);
 assert.equal(await app.getByLabel('项目需求',{exact:true}).count(),0,'project detail has no composer');
 assert.equal(await app.getByRole('button',{name:'发送到当前项目会话',exact:true}).count(),0);
 await app.getByRole('button',{name:'返回主界面',exact:true}).click();
 assert.ok(await app.getByLabel('项目需求',{exact:true}).isDisabled());
 assert.equal(await app.getByLabel('项目需求',{exact:true}).getAttribute('placeholder'),'开发中');
 assert.ok(await app.getByRole('button',{name:'发送（开发中）',exact:true}).isDisabled());
 assert.equal(await page.evaluate(()=>window.sent.length),0,'disabled composer must not send messages');
 const hidden=(await page.evaluate(()=>window.contexts)).at(-1);assert.equal(hidden.structuredContent.page,'home');
 await page.screenshot({path:join(root,'project-home.png')});
 for(const size of [{width:768,height:1024},{width:375,height:812}]){await page.setViewportSize(size);await page.waitForTimeout(150);assert.ok(await app.locator('.project-home').evaluate(el=>el.scrollWidth<=el.clientWidth));}
 await page.setViewportSize({width:1440,height:900});
 // Wait for asynchronous homepage crop and verify stored square PNG dimensions.
 for(let attempt=0;attempt<80;attempt++){
   await manage({action:'list'});
   const row=sql.prepare('SELECT thumbnail_path FROM projects WHERE id=?').get(first.project_id);
   if(row.thumbnail_path){const png=await readFile(row.thumbnail_path);assert.equal(png.readUInt32BE(16),256);assert.equal(png.readUInt32BE(20),256);break;}
   if(attempt===79)throw Error('Homepage thumbnail was not generated');
   await new Promise(resolve=>setTimeout(resolve,250));
 }
 await app.locator(`[data-project-id="${first.project_id}"] .project-thumbnail img`).waitFor();
 await page.screenshot({path:join(root,'project-home.png')});
 const standalone=await browser.newPage();
 const standaloneUrl=new URL(bootstrap.api);standaloneUrl.hostname='localhost';standaloneUrl.pathname=standaloneUrl.pathname.replace('/api/site','/canvas');
 await standalone.goto(standaloneUrl.href);
 await standalone.locator(`[data-project-id="${first.project_id}"] .project-open`).click();
 await standalone.locator('.page-caption[data-ready="true"]').waitFor();
 await standalone.getByRole('button',{name:'返回主界面',exact:true}).click();
 await standalone.getByRole('heading',{name:'Website Builder',exact:true}).waitFor();
 await standalone.close();
 await app.getByRole('button',{name:'删除项目 Forest studio',exact:true}).click();
 await app.getByRole('button',{name:'删除项目 Forest studio',exact:true}).waitFor({state:'hidden'});
 assert.ok(sql.prepare('SELECT deleted_at FROM projects WHERE id=?').get(first.project_id).deleted_at);
 assert.ok((await stat(join(first.directory,'index.html'))).isFile());assert.ok((await stat(resource.path)).isFile());
 assert.ok((await client.callTool({name:'website_project',arguments:{thread_id:'manager-thread',project_id:first.project_id}})).isError);
 await app.getByRole('button',{name:'撤销',exact:true}).click();
 await app.locator(`[data-project-id="${first.project_id}"] .project-open`).waitFor();
 assert.equal(sql.prepare('SELECT deleted_at FROM projects WHERE id=?').get(first.project_id).deleted_at,null);
 assert.deepEqual(errors,[]);
 sql.close();
 console.log(`PASS: ${globalEntry?'global entry without chat ID; ':''}SQLite legacy import, scoped panel context, resources, 1:1 thumbnail, home/detail navigation, folder request, disabled home composer, responsive UI and soft deletion`);
 console.log(`Visual preview: ${join(root,'project-home.png')}`);
}finally{if(browser)await browser.close();if(host)await new Promise(resolve=>host.close(resolve));await client.close();}
