import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {chromium} from '@playwright/test';

const root=await mkdtemp(join(tmpdir(),'website-canvas-loading-'));
const env={...process.env,WEBSITE_BUILDER_DATA_DIR:root,CODEX_THREAD_ID:'loading-thread'};
delete env.WEBSITE_BUILDER_PROJECT_ROOT;
const client=new Client({name:'canvas-loading-test',version:'1'});
const call=async(name,args)=>{const result=await client.callTool({name,arguments:args});assert.ok(!result.isError,JSON.stringify(result));return JSON.parse(result.content[0].text);};
let browser,host,release;
try{
  await client.connect(new StdioClientTransport({command:process.execPath,args:[resolve('dist/server/index.js')],env}));
  const project=await call('website_project',{thread_id:'loading-thread',name:'Loading test',pages:['index','shop','about'].map(path=>({path:path+'.html',title:path}))});
  await call('website_write',{thread_id:'loading-thread',project_id:project.project_id,files:['index','shop','about'].map(path=>({path:path+'.html',content:`<!doctype html><html><head><script>parent.postMessage({type:'test:mounted',path:'${path}'},'*');window.websiteReady=new Promise(resolve=>setTimeout(resolve,1200));</script></head><body style="margin:0"><h1>${path}</h1><div style="height:1100px">Content</div></body></html>`}))});
  host=spawn(process.execPath,['dist/server/index.js','--preview'],{env,stdio:['ignore','pipe','pipe']});
  const url=await new Promise((resolve,reject)=>{host.stdout.once('data',data=>resolve(data.toString().trim()));host.once('error',reject);});
  browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  await page.addInitScript(()=>{window.mounts=[];addEventListener('message',event=>{if(event.data?.type==='test:mounted')window.mounts.push(event.data.path);});});
  let gateOpen=false;
  const gate=new Promise(resolve=>{release=()=>{gateOpen=true;resolve();};});
  await page.route(url=>url.pathname.endsWith('/api/project-sync'),async route=>{
    if(new URL(route.request().url()).searchParams.get('metadata_only')==='0'&&!gateOpen)await gate;
    await route.continue();
  });
  await page.goto(url);
  await page.waitForFunction(()=>document.querySelectorAll('.page-panel').length===3);
  assert.equal(await page.locator('.page-loader').count(),3,'all planned panels sweep before any document payload');
  assert.equal(await page.locator('.page-heading').count(),3);
  assert.equal(await page.locator('iframe').count(),0);
  for(const name of await page.locator('.page-loader').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node,'::before').animationName)))assert.equal(name,'loading-sweep');
  assert.equal(await page.locator('.canvas-help').count(),0);
  release();
  await page.waitForFunction(()=>window.mounts.length===3);
  assert.equal(await page.locator('.frame-glass.is-loading').count(),3,'DOM measurement must not reveal pages before websiteReady');
  await page.waitForFunction(()=>document.querySelectorAll('.page-caption[data-ready=true]').length===3);
  assert.equal(await page.locator('.page-loader').count(),0);
  const sources=await page.locator('iframe').evaluateAll(nodes=>nodes.map(node=>node.src));
  await page.waitForTimeout(7200); // More than two old recovery-timer periods.
  assert.deepEqual((await page.evaluate(()=>window.mounts)).sort(),['about','index','shop']);
  assert.deepEqual(await page.locator('iframe').evaluateAll(nodes=>nodes.map(node=>node.src)),sources);
  await page.getByRole('button',{name:'刷新网站',exact:true}).click();await page.waitForTimeout(900);
  assert.deepEqual((await page.evaluate(()=>window.mounts)).sort(),['about','index','shop'],'sync refresh does not remount loaded frames');
  const frame=page.frameLocator('iframe[title="index.html"]');
  const show=()=>frame.locator('body').evaluate(()=>parent.postMessage({type:'website-builder:blocked',url:'https://example.invalid/toast'},'*'));
  await show();await page.locator('.message[role=status]').waitFor();
  await page.waitForTimeout(2000);await show();
  await page.waitForTimeout(1400);assert.equal(await page.locator('.message[role=status]').count(),1,'repeated notice restarts its three-second timer');
  await page.waitForTimeout(1800);assert.equal(await page.locator('.message[role=status]').count(),0);
  await page.screenshot({path:join(root,'loaded-canvas.png')});
  console.log('PASS: metadata-first simultaneous panels, animated sweep until render ready, exactly one iframe mount past 6 seconds, refresh dedupe, 3s Toast/repeated timer and no shortcut tip');
  console.log(`Canvas: ${join(root,'loaded-canvas.png')}`);
}finally{release?.();if(browser)await browser.close();if(host){host.kill();await new Promise(resolve=>host.once('exit',resolve));}await client.close();}
