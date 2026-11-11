import assert from 'node:assert/strict';
import { mkdtemp, readFile, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, extname, sep } from 'node:path';
import { createServer } from 'node:http';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { chromium } from '@playwright/test';

const root=await mkdtemp(join(tmpdir(),'website-ui-'));
const env={...process.env,WEBSITE_BUILDER_PREVIEW_VENDOR_FIXTURES:'1',WEBSITE_BUILDER_ROOT:resolve('../website'),WEBSITE_BUILDER_PROJECT_ROOT:join(root,'project'),WEBSITE_BUILDER_SKILL_ROOT:resolve('skills/website-builder')};
const client=new Client({name:'shared-ui-test',version:'1'});
const call=async(name,args)=>{const result=await client.callTool({name,arguments:args});assert.ok(!result.isError,JSON.stringify(result));return JSON.parse(result.content[0].text);};
let browser,service;
try{
 await client.connect(new StdioClientTransport({command:process.execPath,args:[resolve('dist/server/index.js')],env}));
 const state=await call('website_project',{thread_id:'shared-ui',pages:[{path:'index.html',title:'Full'},{path:'nested/about.html',title:'Nested'},{path:'login.html',title:'Login'},{path:'fragment.html',title:'Fragment'},{path:'direct.html',title:'Direct'}]});
 const ids={thread_id:state.thread_id,project_id:state.project_id};
 const shell=body=>`<!doctype html><html><head><meta charset="utf-8"><title>UI</title><script src="app.js"></script><script src="js/ec-sdk.js"></script></head><body>${body}</body></html>`;
 const html=shell('<button id="open" onclick="document.querySelector(\'#modal\').hidden=false">Open</button><button id="guest" onclick="APP.wishlist.add(\'B012345678\')">Save</button><div id="modal" data-overlay-root hidden><div data-overlay-backdrop style="position:fixed;inset:0;background:#0006"><span id="decoration" style="display:block;width:30px;height:30px">Backdrop</span></div><section data-overlay-panel style="position:fixed;right:0;top:50px;width:260px;background:white;padding:20px"><input aria-label="Inside"><button onclick="document.querySelector(\'#modal\').hidden=true">Close panel</button></section></div>');
 await call('website_write',{...ids,files:[
  {path:'app.js',content:'window.uiMessages={close:"关闭"};window.commerceConfig={storageKey:"ui-test",loginUrl:"login.html",loginRequiredMessage:"请先登录"};window.earlyToast=Toast.info("Before body",{duration:0});'},
  {path:'js/ec-sdk.js',content:await readFile('skills/website-builder/assets/commerce/ec-sdk.js','utf8')},
  {path:'index.html',content:html},
  {path:'nested/about.html',content:'<!doctype html><html><head><title>Nested</title></head><body>About</body></html>'},
  {path:'login.html',content:'<!doctype html><html><head><title>Login</title></head><body>Login</body></html>'},
  {path:'fragment.html',fragment:true,content:'<main>Fragment</main>'},
  {path:'js/app.js',content:'window.tailwind=window.tailwind||{};'},
  {path:'js/data.js',content:'window.productData=[];'},
  ...['header','footer','card'].map(name=>({path:`components/${name}.js`,content:`customElements.define('${name}-component',class extends HTMLElement{});`}))
 ]});
 // Direct-write + finish must receive the same support as tool writes.
 await writeFile(join(state.directory,'direct.html'),'<html><body>Direct</body></html>');
 await call('website_project',{...ids,action:'finish',paths:['direct.html']});
 for(const file of ['index.html','nested/about.html','fragment.html','login.html','direct.html']){
  const source=await readFile(join(state.directory,file),'utf8');
  assert.equal((source.match(/<toast-component\b/g)||[]).length,1);
  assert.equal((source.match(/<script[^>]*src="[^"]*components\/toast.js"/g)||[]).length,1);
 }
 const nested=await readFile(join(state.directory,'nested/about.html'),'utf8');assert.ok(nested.includes('src="../components/toast.js"'));
 const main=await readFile(join(state.directory,'index.html'),'utf8');assert.ok(main.indexOf('components/toast.js')<main.indexOf('src="app.js"'));
 await call('website_write',{...ids,files:[{path:'index.html',content:main}]});
 service=createServer(async(req,res)=>{try{const file=resolve(state.directory,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(state.directory+sep))throw Error('invalid');res.setHeader('Content-Type',extname(file)==='.js'?'text/javascript':'text/html');res.end(await readFile(file));}catch{res.writeHead(404).end();}});
 await new Promise(resolve=>service.listen(0,'127.0.0.1',resolve));
 browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage(),errors=[],dialogs=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>{dialogs.push(dialog.message());void dialog.dismiss();});
 const url=`http://127.0.0.1:${service.address().port}`;
 await page.goto(url+'/index.html');
 assert.equal(await page.locator('toast-component').count(),1);assert.ok((await page.locator('toast-component').innerText()).includes('Before body'));
 await page.evaluate(()=>{Toast.clear();Toast.success('<img src=x onerror=alert(1)>',{duration:0});});
 assert.equal(await page.locator('toast-component img').count(),0);
 assert.ok((await page.locator('toast-component').innerText()).includes('<img src=x'));
 await page.getByRole('button',{name:'关闭',exact:true}).click();assert.equal(await page.locator('[data-toast-id]').count(),0);
 await page.mouse.move(1000,650);
 await page.evaluate(()=>Toast.info('Temporary',{duration:120}));await page.getByText('Temporary',{exact:true}).waitFor({state:'hidden'});
 await page.evaluate(()=>{for(let i=0;i<8;i++)Toast.info('Message '+i,{duration:0});});assert.equal(await page.locator('[data-toast-id]').count(),4);
 const same=await page.evaluate(async()=>{const previous=Toast;await new Promise(resolve=>{const script=document.createElement('script');script.src='components/toast.js';script.onload=resolve;document.head.append(script);});return Toast===previous&&document.querySelectorAll('toast-component').length===1;});assert.ok(same);
 await page.evaluate(()=>Toast.clear());
 assert.equal(await page.evaluate(()=>typeof window.Overlay),'undefined','shared overlay API was removed');
 await page.evaluate(()=>document.querySelector('#modal').hidden=false);
 await page.locator('#decoration').click();
 assert.equal(await page.locator('#modal').evaluate(el=>el.hidden),false,'Toast must not intercept backdrop clicks');
 await page.evaluate(()=>document.querySelector('#modal').hidden=true);
 const lifecycle=await page.evaluate(()=>{
   Toast.clear();const element=document.querySelector('toast-component');
   Toast.info('Disconnect',{duration:5000});const armed=element.timers.size>0;
   const named=element.constructor.name==='ToastComponent'&&typeof element.template==='function'&&typeof element.refresh==='function';
   element.remove();const cleared=armed&&element.timers.size===0&&!element.bound;
   document.body.append(element);const rebound=element.bound&&element.timers.size>0;
   Toast.clear();return {named,cleared,rebound};
 });
 assert.deepEqual(lifecycle,{named:true,cleared:true,rebound:true});
 await page.locator('#guest').click();await page.getByText('请先登录',{exact:true}).waitFor();await page.waitForURL('**/login.html?returnTo=*');
 assert.deepEqual(dialogs,[]);assert.deepEqual(errors,[]);
 const report={result:'PASS',checks:['Toast installed on full/fragment/nested/direct-finish pages once before app','early API, safe text, timeout, manual dismiss, max count and idempotent script','Toast WebComponent template/refresh, disconnect cleanup and reconnect','no shared Overlay API or backdrop interception','guest sees Toast before login navigation; no native alert']};
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/ui-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(browser)await browser.close();if(service){service.closeAllConnections();service.close();}await client.close();}
