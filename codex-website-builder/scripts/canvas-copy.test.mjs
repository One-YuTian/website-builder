import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import {gunzipSync} from 'node:zlib';

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
 const first=await manage({action:'create',name:'Forest studio',});
 await mkdir(join(first.directory,'assets/brand'),{recursive:true});
 const imageBytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=','base64');
 await writeFile(join(first.directory,'assets/brand/logo.png'),imageBytes);
 await writeFile(join(first.directory,'assets/brand/icon.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect x="10" y="5" width="20" height="10" fill="red"/></svg>');
 await writeFile(join(first.directory,'assets/brand/banner.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="600"><rect width="1800" height="600" fill="green"/></svg>');
 await writeFile(join(first.directory,'assets/brand/portrait.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><rect width="800" height="1200" fill="blue"/></svg>');
 const second=await manage({action:'create',panel_id:'another-panel',thread_id:'another-thread',name:'Second project'});
 await manage({action:'create',name:'www.forest.example',panel_id:'domain-panel',thread_id:'domain-thread'});
 assert.equal((await json('website_panel_context',{thread_id:'manager-thread',panel_id:'manager-panel'})).project_id,first.project_id);
 assert.equal((await json('website_panel_context',{thread_id:'another-thread',panel_id:'another-panel'})).project_id,second.project_id);
 await manage({action:'home'});
 const home=await json('website_panel_context',{thread_id:'manager-thread',panel_id:'manager-panel'});
 assert.equal(home.page,'home');assert.ok(home.projects.length>=3);
 assert.equal((await json('website_panel_context',{thread_id:'another-thread',panel_id:'another-panel'})).project_id,second.project_id);
 await manage({action:'open',project_id:first.project_id});
 await json('website_project',{thread_id:'manager-thread',action:'plan',pages:[{path:'index.html',title:'Home'}]});
 const written=await json('website_write',{thread_id:'manager-thread',project_id:first.project_id,files:[{path:'index.html',content:'<!doctype html><html><head><title>Forest</title></head><body style="margin:0;background:#c9dac7"><h1>Forest studio</h1><img src="assets/brand/logo.png" alt="Brand"><input id="live-input"><button id="show-band" onclick="document.getElementById(\'live-band\').style.display=\'block\'">Expand</button><div id="live-band" style="display:none;height:120px;background:rgb(233,21,98)">Current state</div><div style="height:4200px">Sustainable spaces</div></body></html>'}]});
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
 const clipboardMock=`<script>window.copiedImages=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{write:async items=>{const blob=await items[0].getType('image/png');const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let offset=0;offset<bytes.length;offset+=32768)binary+=String.fromCharCode(...bytes.subarray(offset,offset+32768));window.copiedImages.push(btoa(binary));}}});</script>`;
 const html=appResource.contents[0].text.replace('<head>','<head>'+clipboardMock);
 assert.deepEqual(appResource.contents[0]._meta.ui.permissions,{clipboardWrite:{}});
 const captureParts=new Map();let capturedHTML='';
 const bootstrap=JSON.parse(html.match(/window\.__WEBSITE_BUILDER__=(.*?);<\/script>/)[1]);
 // Native-host protocol harness forwards actual MCP tool calls; captures sends without posting to a real user chat.
 host=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><body style="margin:0"><iframe id="app" style="border:0;width:100vw;height:100vh"></iframe></body></html>');});
 await new Promise(resolve=>host.listen(0,'127.0.0.1',resolve));
 browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.exposeFunction('serverTool',async params=>{
   if(params.name==='website_projects'&&params.arguments.action==='capture'){const args=params.arguments;const value=(captureParts.get(args.capture_id)||'')+args.chunk;captureParts.set(args.capture_id,value);if(args.final)capturedHTML=gunzipSync(Buffer.from(value,'base64')).toString();}
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
 await app.getByRole('complementary',{name:'项目目录',exact:true}).waitFor();
 assert.equal(await app.getByRole('heading',{name:'Website Builder',exact:true}).count(),0);
 assert.equal(await app.locator('.project-home').evaluate(el=>getComputedStyle(el,'::before').position),'fixed');
 assert.ok(await app.locator('.project-compose-inner').evaluate(el=>{const r=el.getBoundingClientRect(),offset=innerHeight/2-(r.top+r.bottom)/2;return offset>=39&&offset<=89;}),'home composer is lifted above the center');
 assert.ok(await app.locator('.project-sidebar').evaluate(el=>el.getBoundingClientRect().top<=20),'project list is aligned to the top');
 const panelLocks=await app.locator('.project-compose h2').evaluate(el=>{let menu=false;const handler=()=>menu=true;el.addEventListener('contextmenu',handler);const context=!el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}));el.removeEventListener('contextmenu',handler);return {context,menu,select:!el.dispatchEvent(new Event('selectstart',{bubbles:true,cancelable:true})),css:getComputedStyle(el).userSelect};});
 assert.deepEqual(panelLocks,{context:true,menu:false,select:true,css:'none'});
 assert.equal(await app.locator('.project-groups').evaluate(el=>getComputedStyle(el).scrollbarWidth),'none');
 assert.ok(await app.locator('.project-sidebar').evaluate(el=>{const css=getComputedStyle(el),fade=getComputedStyle(el.parentElement,'::before');return parseFloat(css.paddingLeft)<=8&&parseFloat(css.paddingRight)<=8&&Number(css.zIndex)>Number(fade.zIndex);}));
 assert.equal(await app.locator('.project-home').evaluate(el=>getComputedStyle(el,'::before').clipPath),'none','full-width fade has no hard cutoff beside the library');
 const fadePixels=await page.evaluate(async data=>{const bitmap=await createImageBitmap(await(await fetch('data:image/png;base64,'+data)).blob()),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const context=canvas.getContext('2d');context.drawImage(bitmap,0,0);return [344,364].map(x=>[...context.getImageData(x,10,1,1).data]);},(await page.screenshot()).toString('base64'));
 assert.ok(fadePixels[0].every((value,index)=>Math.abs(value-fadePixels[1][index])<=2),'fade color stays continuous across the former cutoff');
 await app.getByLabel('搜索项目').focus();
 assert.equal(await app.getByLabel('搜索项目').evaluate(el=>getComputedStyle(el).outlineStyle),'none');
 await app.locator('.project-delete').first().hover();
 assert.deepEqual(await app.locator('.project-delete').first().evaluate(el=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color})),{background:'rgba(0, 0, 0, 0)',color:'rgb(52, 56, 61)'});
 await app.locator('.project-open').filter({hasText:'Forest studio'}).waitFor();
 await app.getByText('网站-www.forest.example',{exact:true}).waitFor();
 assert.equal(await app.locator('.tool-rail').count(),0,'global entry opens the library, even with an active project');
 await app.getByLabel('搜索项目').fill('Forest studio');assert.equal(await app.locator('.project-row').count(),1);await app.getByLabel('搜索项目').fill('');
 await app.getByRole('button',{name:/Forest studio/}).first().click();
 await app.locator('.page-caption[data-ready="true"]').waitFor({timeout:30000});
 await app.locator('[data-asset="assets/brand/logo.png"] img').waitFor();
 assert.equal(await app.locator('.page-stage').evaluate(el=>getComputedStyle(el,'::before').position),'fixed');
 assert.equal(await app.locator('.canvas-world').evaluate(el=>el.firstElementChild.className),'asset-gallery');
 assert.equal(await app.locator('[data-asset="assets/brand/logo.png"] .asset-label>span').innerText(),'logo.png');
 assert.equal(await app.locator('.asset-surface').first().evaluate(el=>getComputedStyle(el).backgroundImage),'none');
 assert.equal(await app.getByRole('heading',{name:'网站图片',exact:true}).count(),0);
 assert.equal(await app.locator('.asset-surface').first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
 assert.equal(await app.locator('.asset-surface').first().evaluate(el=>getComputedStyle(el).boxShadow),'none');
 assert.equal(await app.locator('[data-asset="assets/brand/logo.png"]').evaluate(el=>el.offsetWidth),320);
 await app.locator('[data-asset="assets/brand/banner.svg"] .asset-caption').filter({hasText:'1800 × 600'}).waitFor();
 await app.locator('[data-asset="assets/brand/portrait.svg"] .asset-caption').filter({hasText:'800 × 1200'}).waitFor();
 assert.equal(await app.locator('[data-asset="assets/brand/banner.svg"]').evaluate(el=>el.offsetWidth),960);
 assert.equal(await app.locator('[data-asset="assets/brand/portrait.svg"]').evaluate(el=>el.offsetWidth),400);
 assert.equal(await app.locator('[data-asset="assets/brand/portrait.svg"] img').evaluate(el=>el.offsetHeight),600);
 assert.ok(await app.locator('.asset-surface img').first().evaluate(el=>{const a=el.getBoundingClientRect(),b=el.parentElement.getBoundingClientRect();return Math.abs(a.left-b.left)<1&&Math.abs(a.top-b.top)<1;}),'image starts at top left');
 assert.ok(await app.locator('.asset-gallery').evaluate(el=>el.offsetTop<el.parentElement.querySelector('.page-panel').offsetTop));
 const live=app.frameLocator('iframe[title="index.html"]');
 const previewLocks=await live.locator('h1').evaluate(el=>{let menu=false;const handler=()=>menu=true;el.addEventListener('contextmenu',handler);const context=!el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}));el.removeEventListener('contextmenu',handler);return {context,menu,select:!el.dispatchEvent(new Event('selectstart',{bubbles:true,cancelable:true})),css:getComputedStyle(el).userSelect};});
 assert.deepEqual(previewLocks,{context:true,menu:false,select:true,css:'none'});
 await live.locator('#live-input').fill('Current typed value');await live.locator('#show-band').evaluate(button=>button.click());
 assert.equal(await live.locator('#live-band').evaluate(el=>getComputedStyle(el).display),'block');
 await app.getByRole('button',{name:'复制图片 logo.png',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#app').contentWindow.copiedImages.length===1);
 const imageCopy=await app.locator('body').evaluate(()=>window.copiedImages[0]);assert.deepEqual(Buffer.from(imageCopy,'base64'),imageBytes,'copy original PNG bytes, including transparency');
 const beforeBlob=await app.locator('iframe[title="index.html"]').getAttribute('src');const beforeY=await live.locator('#live-band').evaluate(el=>el.offsetTop);
 await app.getByRole('button',{name:'复制 index.html 完整截图',exact:true}).click();
 try{await page.waitForFunction(()=>document.querySelector('#app').contentWindow.copiedImages.length===2,{}, {timeout:20000});}catch(error){console.log(JSON.stringify({notice:await app.locator('body').innerText(),errors,capturedLength:capturedHTML.length,parts:[...captureParts.values()].map(x=>x.length)}));throw error;}
 const copied=Buffer.from(await app.locator('body').evaluate(()=>window.copiedImages[1]),'base64');
 assert.equal(copied.readUInt32BE(16),1280);assert.ok(copied.readUInt32BE(20)>4200,'page copy is full height, beyond capped preview');
 assert.ok(capturedHTML.includes('value="Current typed value"'),'snapshot preserves current form value');
 assert.equal(beforeBlob,await app.locator('iframe[title="index.html"]').getAttribute('src'));assert.equal(await live.locator('#live-input').inputValue(),'Current typed value');
 const pixel=await page.evaluate(async({data,y})=>{const response=await fetch('data:image/png;base64,'+data);const bitmap=await createImageBitmap(await response.blob());const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const context=canvas.getContext('2d');context.drawImage(bitmap,0,0);return [...context.getImageData(20,y+10,1,1).data];},{data:copied.toString('base64'),y:Math.round(beforeY)});
 assert.deepEqual(pixel,[233,21,98,255],'full screenshot reflects expanded live content');
 assert.equal(await app.getByRole('button',{name:'查看网站图片',exact:true}).count(),0);await page.waitForTimeout(200);await page.screenshot({path:join(root,'project-assets.png')});
 await app.getByRole('button',{name:'复制图片 icon.svg',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#app').contentWindow.copiedImages.length===3);
 const svgCopy=await app.locator('body').evaluate(()=>window.copiedImages[2]);const converted=Buffer.from(svgCopy,'base64');assert.equal(converted.readUInt32BE(16),40);assert.equal(converted.readUInt32BE(20),20);
 const alpha=await page.evaluate(async data=>{const bitmap=await createImageBitmap(await(await fetch('data:image/png;base64,'+data)).blob());const canvas=document.createElement('canvas');canvas.width=40;canvas.height=20;const context=canvas.getContext('2d');context.drawImage(bitmap,0,0);return context.getImageData(0,0,1,1).data[3];},svgCopy);assert.equal(alpha,0,'SVG copies as transparent PNG at original dimensions');
 await app.locator('body').evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{write:async()=>{throw new DOMException('Clipboard permission denied','NotAllowedError');}}}));
 await app.getByRole('button',{name:'复制图片 logo.png',exact:true}).click();await app.getByText(/复制失败：Clipboard permission denied/).waitFor();assert.equal(await app.locator('body').evaluate(()=>window.copiedImages.length),3);
 // Fit prioritizes width, keeps all columns before the rail, and starts at the top.
 await app.getByRole('button',{name:'画布缩放',exact:true}).click();
 await app.getByRole('button',{name:'放大画布',exact:true}).click();await app.getByRole('button',{name:'放大画布',exact:true}).click();
 const fitBounds=async()=>{
   await app.getByRole('button',{name:'查看全部',exact:true}).click();await page.waitForTimeout(120);
   const value=await app.locator('.page-stage').evaluate(el=>{const stage=el.getBoundingClientRect(),world=el.querySelector('.canvas-world').getBoundingClientRect(),rail=el.querySelector('.tool-rail').getBoundingClientRect(),matrix=new DOMMatrix(getComputedStyle(el.querySelector('.canvas-world')).transform);return {left:world.left-stage.left,top:world.top-stage.top,right:world.right-stage.left,bottom:world.bottom-stage.top,rail:rail.left-stage.left,height:stage.height,zoom:matrix.a};});
   assert.ok(Math.abs(value.left-28)<1&&Math.abs(value.top-104)<1&&Math.abs(value.right-(value.rail-16))<1,JSON.stringify(value));return value;
 };
 const fitted=await fitBounds(),again=await fitBounds();assert.ok(Math.abs(fitted.zoom-again.zoom)<0.00001,'fit does not drift with repeated clicks');
 assert.ok(fitted.bottom>fitted.height,'tall content keeps width priority instead of shrinking to fit height');
 await page.setViewportSize({width:768,height:1024});await fitBounds();
 await page.setViewportSize({width:1440,height:900});await fitBounds();await page.screenshot({path:join(root,'project-fit-all.png')});
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
 assert.ok(await app.locator('.project-sidebar').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>0&&r.bottom<innerHeight}));
 assert.ok(await app.locator('.project-sidebar').evaluate(el=>getComputedStyle(el).backdropFilter.includes('blur')));
 assert.match(await app.locator('.project-description time').first().innerText(),/^\d{2}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
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
 assert.ok(await app.locator('.project-sidebar').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>0&&r.bottom<innerHeight}));
 assert.ok(await app.locator('.project-sidebar').evaluate(el=>getComputedStyle(el).backdropFilter.includes('blur')));
 assert.match(await app.locator('.project-description time').first().innerText(),/^\d{2}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
 const standalone=await browser.newPage();
 const standaloneUrl=new URL(bootstrap.api);standaloneUrl.hostname='localhost';standaloneUrl.pathname=standaloneUrl.pathname.replace('/api/site','/canvas');
 await standalone.goto(standaloneUrl.href);
 await standalone.locator(`[data-project-id="${first.project_id}"] .project-open`).click();
 await standalone.locator('.page-caption[data-ready="true"]').waitFor();
 await standalone.context().grantPermissions(['clipboard-read','clipboard-write'],{origin:new URL(standaloneUrl.href).origin});
 await standalone.locator('[data-asset="assets/brand/logo.png"] img').waitFor();
 await standalone.getByRole('button',{name:'复制 index.html 完整截图',exact:true}).click();
 await standalone.locator('.message').filter({hasText:'图片已复制到剪贴板'}).waitFor({timeout:30000});
 const nativeCopy=await standalone.evaluate(async()=>{const items=await navigator.clipboard.read();const blob=await items[0].getType('image/png');const bitmap=await createImageBitmap(blob);return {width:bitmap.width,height:bitmap.height};});
 assert.equal(nativeCopy.width,1280);assert.ok(nativeCopy.height>4200,'native browser image clipboard contains full page PNG');
 console.log(JSON.stringify({nativeClipboard:'PASS',...nativeCopy}));
 await standalone.getByRole('button',{name:'返回主界面',exact:true}).click();
 await standalone.getByRole('complementary',{name:'项目目录',exact:true}).waitFor();
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
 console.log('PASS: lifted composer, library above continuous full-width fade, UI/preview interaction locks, width-first measured canvas fit at two viewport sizes');
 console.log('PASS: original PNG clipboard bytes, live form/expanded state, full 4200+px screenshot and pixel check, image gallery, domain title/date, frosted margins and denied clipboard reporting');
 console.log(`PASS: ${globalEntry?'global entry without chat ID; ':''}SQLite legacy import, scoped panel context, resources, 1:1 thumbnail, home/detail navigation, folder request, disabled home composer, responsive UI and soft deletion`);
 console.log(`Canvas image/copy and frosted UI verification: ${join(root,'project-home.png')}`);
}finally{if(browser)await browser.close();if(host)await new Promise(resolve=>host.close(resolve));await client.close();}
