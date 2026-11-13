import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { deflateSync, gunzipSync } from 'node:zlib';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { chromium } from '@playwright/test';

// A valid, incompressible PNG reproduces the old 3.8MB gzip/base64 failure.
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function chunk(type,bytes){const name=Buffer.from(type),header=Buffer.alloc(4),crc=Buffer.alloc(4);header.writeUInt32BE(bytes.length);crc.writeUInt32BE(crc32(Buffer.concat([name,bytes])));return Buffer.concat([header,name,bytes,crc]);}
const width=1536,height=1024,raw=Buffer.alloc((width*3+1)*height);
for(let y=0;y<height;y++)randomBytes(width*3).copy(raw,y*(width*3+1)+1);
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=2;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const root=await mkdtemp(join(tmpdir(),'website-large-preview-'));
const env={...process.env, WEBSITE_BUILDER_PREVIEW_VENDOR_FIXTURES:'1',WEBSITE_BUILDER_ROOT:root,WEBSITE_BUILDER_PROJECT_ROOT:join(root,'project'),WEBSITE_BUILDER_SKILL_ROOT:resolve('skills/website-builder')};
const client=new Client({name:'large-preview-test',version:'1'});
const call=async(name,args)=>{const value=await client.callTool({name,arguments:args});assert.ok(!value.isError,JSON.stringify(value));return value;};
const json=async(name,args)=>JSON.parse((await call(name,args)).content[0].text);
let browser,preview;
try{
  await client.connect(new StdioClientTransport({command:process.execPath,args:[resolve('dist/server/index.js')],env}));
  const state=await json('website_project',{thread_id:'large-preview',name:'Large images',pages:[{path:'index.html',title:'Images'},{path:'large.html',title:'Large CSS page'}]});
  const ids={thread_id:state.thread_id,project_id:state.project_id};
  await mkdir(join(state.directory,'assets'));await writeFile(join(state.directory,'assets/photo.png'),png);
  const shell=body=>`<!doctype html><html><head><meta charset="utf-8"><title>Large preview</title><script src="app.js"></script></head><body>${body}</body></html>`;
  await json('website_write',{...ids,files:[
    {path:'app.js',content:'const resize=()=>document.documentElement.style.fontSize=innerWidth<768?"12px":"16px";resize();addEventListener("resize",resize);'},
    {path:'index.html',content:shell('<img alt="Logo" width="120" height="80" src="assets/photo.png"><picture><source srcset="assets/photo.png 1x, assets/photo.png 2x"><img alt="Photo" width="600" height="400" src="assets/photo.png"></picture><script>const image=new Image();image.alt="Dynamic";image.width=80;image.src="assets/photo.png";document.body.append(image);</script>')},
    {path:'large.html',content:shell('<style>.banner{width:600px;height:400px;background-image:url("assets/photo.png")}</style><div class="banner"></div><img alt="Photo" width="600" height="400" src="assets/photo.png">')},
  ]});
  const synced=(await call('project_sync',{thread_id:state.thread_id,wait_ms:0}))._meta.sync;
  assert.deepEqual(synced.errors,{});assert.ok(synced.manifest.pages.every(page=>page.status==='ready'));
  assert.equal(typeof synced.pages['index.html'],'string');
  const html=gunzipSync(Buffer.from(synced.pages['index.html'],'base64')).toString();
  assert.ok(html.includes('https://website-builder.invalid/preview-assets/'));
  assert.ok(html.length<100000,'local static/dynamic/srcset images are not embedded in HTML');
  const descriptor=synced.pages['large.html'];assert.equal(typeof descriptor.resource,'string');
  assert.ok(JSON.stringify(synced).length<2800000,'sync envelope stays below transport budget');
  let offset=0,total=Infinity;const chunks=[];
  while(offset<total){const response=(await call('proxy_resource',{url:descriptor.resource,offset,raw:true}))._meta.resource;assert.ok(response.base64.length<710000);chunks.push(Buffer.from(response.base64,'base64'));offset=response.next;total=response.total;}
  const large=gunzipSync(Buffer.concat(chunks)).toString();
  assert.ok(Buffer.concat(chunks).toString('base64').length>3800000,'fixture exceeds old per-page transfer cap');
  assert.ok(large.includes('.banner'));
  assert.ok((await client.callTool({name:'proxy_resource',arguments:{url:'https://website-builder.invalid/preview-assets/missing',offset:0}})).isError);
  env.CODEX_THREAD_ID=state.thread_id;
  preview=spawn(process.execPath,['dist/server/index.js','--preview'],{env,stdio:['ignore','pipe','pipe']});
  const url=await new Promise((resolve,reject)=>{preview.stdout.once('data',data=>resolve(data.toString().trim()));preview.once('error',reject);});
  browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage(),errors=[],direct=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(request.url().startsWith('https://website-builder.invalid/'))direct.push(request.url());});
  let transientFailure=false;
  await page.route('**/api/resource*',route=>{
    const resource=new URL(route.request().url()).searchParams.get('url');
    if(resource===descriptor.resource&&!transientFailure){transientFailure=true;return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'transient chunk failure'})});}
    return route.continue();
  });
  await page.goto(url);
  await page.locator('.canvas-world').waitFor();
  await page.waitForFunction(()=>document.querySelectorAll('.page-caption[data-ready="true"]').length===2);
  for(const file of ['index.html','large.html']){
    const frame=page.frameLocator(`iframe[title="${file}"]`);
    await frame.locator('img').first().evaluate(async image=>{for(let attempt=0;attempt<200;attempt++){if(image.complete&&image.naturalWidth>0){await image.decode();return;}await new Promise(resolve=>setTimeout(resolve,100));}throw Error('Image did not finish proxy loading');});
    assert.equal(await frame.locator('img').first().evaluate(image=>image.naturalWidth),width);
  }
  await page.frameLocator('iframe[title="index.html"]').getByAltText('Dynamic').evaluate(async image=>{for(let attempt=0;attempt<200;attempt++){if(image.complete&&image.naturalWidth>0){await image.decode();return;}await new Promise(resolve=>setTimeout(resolve,100));}throw Error('Dynamic image did not load');});
  const background=page.frameLocator('iframe[title="large.html"]').locator('.banner');
  assert.ok((await background.evaluate(el=>getComputedStyle(el).backgroundImage)).includes('data:image/png'));
  await page.getByRole('button',{name:'页面宽度',exact:true}).click();
  for(const [viewport,expected]of [['375','12px'],['768','16px']]){
    await page.getByLabel('统一宽度').selectOption(viewport);
    await page.frameLocator('iframe[title="index.html"]').locator('html').evaluate((el,expected)=>new Promise((resolve,reject)=>{let attempts=0;const check=()=>{if(getComputedStyle(el).fontSize===expected)return resolve(true);if(++attempts>50)return reject(Error('root font mismatch'));setTimeout(check,30);};check();}),expected);
  }
  assert.ok(transientFailure,'large-page transport retry was exercised');
  assert.deepEqual(errors,[]);assert.deepEqual(direct,[]);
  assert.equal(hash(await readFile(join(state.directory,'assets/photo.png'))),hash(png),'preview does not compress/modify source image');
  const report={result:'PASS',imageBytes:png.length,largePageGzipBase64:Buffer.concat(chunks).toString('base64').length,checks:['local img/srcset/dynamic images loaded through bounded chunks','oversized CSS/HTML page loads through chunked gzip instead of false generation failure','sync and individual resource envelopes bounded','transient chunk failure retries without losing other page payloads','no direct virtual-origin request','mobile root size retained across resize','source image hash unchanged']};
  await mkdir('artifacts',{recursive:true});await writeFile('artifacts/large-preview-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(browser)await browser.close();if(preview)preview.kill();await client.close();}
