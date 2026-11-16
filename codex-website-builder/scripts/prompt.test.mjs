import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:http';
import { chromium } from '@playwright/test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const root=await mkdtemp(join(tmpdir(),'website-prompt-'));
const client=new Client({name:'prompt-test',version:'1'});
let browser,host;
try{
  await client.connect(new StdioClientTransport({command:process.execPath,args:[resolve('dist/server/index.js')],env:{...process.env,CODEX_THREAD_ID:'prompt-thread',WEBSITE_BUILDER_DATA_DIR:root,WEBSITE_BUILDER_PROJECT_ROOT:join(root,'project'),WEBSITE_BUILDER_SKILL_ROOT:resolve('skills/website-builder')}}));
  const call=async(name,args)=>{const result=await client.callTool({name,arguments:args});assert.ok(!result.isError,JSON.stringify(result));return result;};
  const resource=await client.readResource({uri:'ui://codex-website-builder/canvas'});
  host=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<html><body style="margin:0"><iframe id="app" style="border:0;width:100vw;height:100vh"></iframe></body></html>');});
  await new Promise(resolve=>host.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.exposeFunction('serverTool',params=>client.callTool(params));
  await page.goto(`http://127.0.0.1:${host.address().port}`);
  await page.evaluate(html=>{
    window.sent=[];window.contexts=[];window.toolCalls=[];window.rejectMessage=true;
    addEventListener('message',async event=>{
      const r=event.data;if(!r?.jsonrpc||r.id===undefined)return;
      try{
        let result={};
        if(r.method==='ui/initialize')result={protocolVersion:'2026-01-26',hostInfo:{name:'Test Codex',version:'26.1112.1'},hostCapabilities:{serverTools:{},updateModelContext:{},message:{text:{}},experimental:{'openai/message':{}}},hostContext:{platform:'desktop',displayMode:'fullscreen'}};
        if(r.method==='tools/call'){
          window.toolCalls.push(r.params);result=await window.serverTool(r.params);
          if(window.failPageOnce&&r.params.name==='project_sync'&&result._meta?.sync?.pages?.['index.html']){
            delete result._meta.sync.pages['index.html'];result._meta.sync.errors={'index.html':'temporary-preview-error'};window.failPageOnce=false;window.failedPage=true;
          }
        }
        if(r.method==='ui/update-model-context')window.contexts.push(r.params);
        if(r.method==='ui/message'){window.sent.push(r.params);result={isError:window.rejectMessage};}
        event.source.postMessage({jsonrpc:'2.0',id:r.id,result},'*');
      }catch(error){event.source.postMessage({jsonrpc:'2.0',id:r.id,error:{code:-32603,message:error.message}},'*');}
    });
    document.querySelector('#app').srcdoc=html;
  },resource.contents[0].text);
  const app=page.frameLocator('#app');
  await app.getByRole('textbox',{name:'项目需求',exact:true}).waitFor();
  const canvas=app.locator('.dot-background canvas');
  assert.ok(await canvas.isVisible());
  await canvas.evaluate(c=>{
    const ctx=c.getContext('2d'),arc=ctx.arc.bind(ctx),clear=ctx.clearRect.bind(ctx);
    window.hoverDraw={count:0,max:0};
    ctx.clearRect=(...args)=>{window.hoverDraw.count=0;return clear(...args);};
    ctx.arc=(...args)=>{window.hoverDraw.max=Math.max(window.hoverDraw.max,++window.hoverDraw.count);return arc(...args);};
  });
  const pixel=()=>canvas.evaluate(c=>{const ctx=c.getContext('2d');return Math.max(...[...ctx.getImageData(812,748,4,4).data].filter((_,i)=>i%4===3));});
  await page.mouse.move(1,1);await page.waitForTimeout(200);const before=await pixel();
  await page.mouse.move(814,750);await page.waitForTimeout(500);assert.ok(await pixel()>before+30,'hover should highlight dots through foreground layers');
  assert.ok(await canvas.evaluate(()=>window.hoverDraw.max<1600),'hover only redraws nearby dots rather than the full viewport');
  const textarea=app.getByRole('textbox',{name:'项目需求',exact:true});
  await textarea.fill('创建巴西葡萄牙语家居电商网站');
  const height=await app.locator('.project-prompt').evaluate(n=>n.getBoundingClientRect().height);
  await textarea.fill('创建巴西葡萄牙语家居电商网站\n'.repeat(30));
  assert.equal(await app.locator('.project-prompt').evaluate(n=>n.getBoundingClientRect().height),height);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRWQAAAAASUVORK5CYII=','base64');
  await app.locator('input[type=file]').setInputFiles([{name:'reference.png',mimeType:'image/png',buffer:png},{name:'products.json',mimeType:'application/json',buffer:Buffer.from('[{"id":"1"}]')}]);
  assert.equal(await app.locator('.prompt-files>span').count(),2);
  assert.ok(await app.locator('.project-prompt').evaluate(form=>{
    const files=form.querySelector('.prompt-files').getBoundingClientRect();
    const input=form.querySelector('textarea').getBoundingClientRect();
    return files.bottom<=input.top;
  }),'imported files appear above the text area');
  await app.getByRole('button',{name:'发送需求',exact:true}).click();
  await app.getByRole('alert').filter({hasText:'未接受消息'}).waitFor();
  assert.ok((await textarea.inputValue()).includes('巴西'));
  assert.equal(await app.locator('.prompt-files>span').count(),2,'rejection retains attachments');
  await page.evaluate(()=>window.rejectMessage=false);
  await app.getByRole('button',{name:'发送需求',exact:true}).click();
  await app.getByRole('button',{name:'正在创建项目'}).waitFor();
  await app.locator('form.project-prompt').evaluate(form=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  await page.waitForFunction(()=>window.sent.length===2);
  const sent=await page.evaluate(()=>window.sent[1]);
  assert.deepEqual(sent._meta['openai/message'],{target:'new',send:true});
  const requirement=(await textarea.inputValue()).trim();
  assert.deepEqual(sent.content.filter(c=>c.type==='text').map(c=>c.text),[requirement],'visible text contains only the user requirement');
  assert.ok(sent.content.some(c=>c.type==='image'&&c.data===png.toString('base64')));
  assert.ok(sent.content.some(c=>c.type==='resource'&&c.resource.mimeType==='application/json'));
  const submission=await page.evaluate(()=>window.contexts.map(c=>c.structuredContent?.submission).filter(Boolean).at(-1));
  const discover=async text=>JSON.parse((await call('website_panel_context',{thread_id:'prompt-new-thread',requirement:text})).content[0].text);
  assert.equal((await discover('Unrelated requirement')).submission,undefined);
  assert.equal((await discover(requirement)).submission.request_id,submission.request_id,'new chat discovers routing from backend without visible instructions');
  await call('website_projects',{action:'submission',submission_start:true,panel_id:'duplicate-submission-panel',request_id:'duplicate-submission-request',requirement});
  assert.equal((await discover(requirement)).submission_ambiguous,true,'identical concurrent requests cannot select an arbitrary panel');
  await call('website_projects',{action:'submission',cancel:true,panel_id:'duplicate-submission-panel',request_id:'duplicate-submission-request'});
  assert.equal((await discover(requirement)).submission.panel_id,submission.panel_id);
  // An unrelated project's creation must not finish this submission.
  await call('website_projects',{action:'create',panel_id:'unrelated-panel',thread_id:'unrelated-thread',name:'Unrelated'});
  await page.waitForTimeout(1200);
  assert.ok(await app.getByRole('button',{name:'正在创建项目'}).isDisabled());
  // Bind the originating panel to an existing conversation before the new
  // chat creates its project, exercising the cross-thread handoff.
  const original=JSON.parse((await call('website_projects',{action:'create',panel_id:submission.panel_id,thread_id:'prompt-thread',name:'Original'})).content[0].text);
  const rejected=await client.callTool({name:'website_projects',arguments:{action:'create',panel_id:submission.panel_id,request_id:'unrelated-request',thread_id:'unrelated-thread'}});
  assert.equal(rejected.isError,true,'unrelated chat cannot claim a bound panel');
  const args={action:'create',panel_id:submission.panel_id,request_id:submission.request_id,thread_id:'prompt-new-thread',name:'Casa Sol',country:'BR',language:'pt-BR',categories:['家居']};
  const created=JSON.parse((await call('website_projects',args)).content[0].text);
  assert.equal(created.ui_reused,true);
  assert.equal(created.thread_id,'prompt-new-thread');
  assert.notEqual(created.project_id,original.project_id);
  const originalContext=JSON.parse((await call('website_project',{action:'status',thread_id:'prompt-thread'})).content[0].text);
  assert.equal(originalContext.project_id,original.project_id,'the originating chat keeps its original project');
  const polling=JSON.parse((await call('website_projects',{action:'submission',panel_id:submission.panel_id,request_id:submission.request_id,thread_id:'prompt-thread'})).content[0].text);
  assert.equal(polling.project.thread_id,'prompt-new-thread','originating panel can poll its matching handoff');
  assert.deepEqual(created.pages,[],'create an empty project before entering detail');
  const projects=JSON.parse((await call('website_projects',{action:'list'})).content[0].text).projects;
  assert.equal(projects.find(p=>p.id===created.project_id).status,'generating','task starts before page planning');
  const repeated=JSON.parse((await call('website_projects',args)).content[0].text);
  assert.equal(created.project_id,repeated.project_id,'creation retry is idempotent');
  await app.getByRole('main',{name:'网站展示画布',exact:true}).waitFor({timeout:10000});
  await app.getByText('项目初始化中',{exact:true}).waitFor();
  assert.equal(await app.locator('.initial-page').count(),0);
  let ready;
  for(let attempt=0;attempt<30;attempt++){
    ready=JSON.parse((await call('website_projects',{action:'submission',panel_id:submission.panel_id,request_id:submission.request_id,thread_id:'prompt-new-thread'})).content[0].text);
    if(ready.detail_ready)break;
    await page.waitForTimeout(100);
  }
  assert.equal(ready.detail_ready,true,'mounted detail acknowledges readiness before generation');
  assert.equal(ready.project.project_id,created.project_id);
  assert.equal(await page.evaluate(()=>window.toolCalls.filter(c=>c.name==='open_canvas').length),0,'submission reuses the original panel');
  assert.equal(page.frames().length,2,'empty detail remains inside the same host frame');
  await call('website_project',{action:'plan',thread_id:'prompt-new-thread',project_id:created.project_id,pages:[{path:'index.html',title:'Home'}]});
  await app.locator('[data-page="index.html"] .page-loader').waitFor();assert.equal(await app.locator('iframe').count(),0,'planned panel sweeps before the real document arrives');
  await page.evaluate(()=>window.failPageOnce=true);
  await writeFile(join(created.directory,'index.html'),'<!doctype html><html><body><h1>Direct file output</h1></body></html>');
  await app.frameLocator('iframe[title="index.html"]').getByRole('heading',{name:'Direct file output'}).waitFor({timeout:20000});
  assert.equal(await page.evaluate(()=>window.failedPage),true,'transient compile failure is retried without a new page version');
  assert.ok(!/Mock|等待生成|隔离/.test(await app.locator('.page-caption').innerText()));
  await writeFile(join(created.directory,'index.html'),'<!doctype html><html><body><h1>Direct file updated</h1></body></html>');
  await app.frameLocator('iframe[title="index.html"]').getByRole('heading',{name:'Direct file updated'}).waitFor({timeout:20000});
  // Reopen from the new chat, even when a fresh view first inherits the source MCP thread.
  const contextCount=await page.evaluate(()=>window.contexts.length);
  const projectCount=JSON.parse((await call('website_projects',{action:'list'})).content[0].text).projects.length;
  await page.evaluate(()=>{const frame=document.createElement('iframe');frame.id='reopened';frame.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;border:0;z-index:1000';frame.srcdoc=document.querySelector('#app').srcdoc;document.body.append(frame);});
  const reopened=page.frameLocator('#reopened');
  await reopened.getByRole('main',{name:'网站展示画布',exact:true}).waitFor();
  await page.waitForFunction(({count,id})=>window.contexts.slice(count).some(value=>value.structuredContent?.project_id===id),{count:contextCount,id:original.project_id});
  const reopenLaunch=await call('open_canvas',{thread_id:'prompt-new-thread'});
  await page.evaluate(params=>document.querySelector('#reopened').contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params},'*'),reopenLaunch);
  await reopened.frameLocator('iframe[title="index.html"]').getByRole('heading',{name:'Direct file updated'}).waitFor({timeout:20000});
  assert.equal(await reopened.locator('.manager-error[role="alert"]').count(),0,'new chat can reopen its bound detail without a panel/thread ownership error');
  assert.equal(JSON.parse((await call('website_projects',{action:'list'})).content[0].text).projects.length,projectCount,'reopening does not create a replacement project');
  await page.evaluate(()=>document.querySelector('#reopened').remove());
  assert.equal(await textarea.count(),0);
  await app.getByRole('button',{name:'返回主界面',exact:true}).click();
  await textarea.waitFor();assert.equal(await textarea.inputValue(),'');
  assert.equal(await app.locator('.prompt-files>span').count(),0);
  assert.ok(await app.getByRole('button',{name:'发送需求',exact:true}).isDisabled());
  const threadLaunch=await call('open_thread_canvas',{thread_id:'prompt-new-thread'});
  assert.equal(threadLaunch.structuredContent.canvas_launch.scope,'thread');
  assert.equal(threadLaunch.structuredContent.canvas_launch.thread_id,'prompt-new-thread');
  await page.evaluate(params=>document.querySelector('#app').contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params},'*'),threadLaunch);
  await app.getByRole('main',{name:'网站展示画布',exact:true}).waitFor();
  await app.getByRole('button',{name:'返回主界面',exact:true}).click();
  await textarea.waitFor();
  await textarea.fill('从对话内插件面板创建另一个任务');
  await app.getByRole('button',{name:'发送需求',exact:true}).click();
  await page.waitForFunction(()=>window.sent.length===3);
  const threadSent=await page.evaluate(()=>window.sent[2]);
  assert.deepEqual(threadSent._meta['openai/message'],{target:'new',send:true},'thread entry also creates a new chat');
  assert.deepEqual(threadSent.content.filter(c=>c.type==='text').map(c=>c.text),['从对话内插件面板创建另一个任务']);
  const nextSubmission=await page.evaluate(()=>window.contexts.map(c=>c.structuredContent?.submission).filter(Boolean).at(-1));
  const second=JSON.parse((await call('website_projects',{action:'create',panel_id:nextSubmission.panel_id,request_id:nextSubmission.request_id,thread_id:'prompt-another-new-thread',name:'Second'})).content[0].text);
  assert.notEqual(second.project_id,created.project_id);
  await app.getByRole('main',{name:'网站展示画布',exact:true}).waitFor();
  await app.getByRole('button',{name:'返回主界面',exact:true}).click();
  await textarea.waitFor();
  await mkdir('artifacts',{recursive:true});
  await page.screenshot({path:'artifacts/home-prompt.png'});
  for(const width of [375,768]){await page.setViewportSize({width,height:900});await page.screenshot({path:`artifacts/home-prompt-${width}.png`});assert.equal(await app.locator('textarea').evaluate(n=>getComputedStyle(n).resize),'none');}
  assert.deepEqual(errors,[]);
  // Direct chat requests also create an empty project before opening details and planning.
  const chat=JSON.parse((await call('website_project',{action:'open',thread_id:'chat-request-thread',new_project:true,name:'Chat Store'})).content[0].text);
  assert.deepEqual(chat.pages,[]);
  const launch=await call('open_canvas',{thread_id:'chat-request-thread'});
  assert.equal(launch.structuredContent.canvas_launch.thread_id,'chat-request-thread');
  const planned=JSON.parse((await call('website_project',{action:'plan',thread_id:'chat-request-thread',project_id:chat.project_id,pages:[{path:'index.html',title:'Home'}]})).content[0].text);
  assert.equal(planned.pages.length,1);
  assert.equal(planned.project_id,chat.project_id);
  console.log('PASS: hover, fixed input, top attachments, rejection recovery, single new-chat send, cross-thread panel handoff, global and thread entry, empty project before detail, detail readiness before planning, reused panel, navigation, clearing and responsive layout');
}finally{await browser?.close();host?.close();await client.close();}
