import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {chromium} from '@playwright/test';
const folder=await mkdtemp(join(tmpdir(),'website-proxy-'));await mkdir(join(folder,'site'));let preview,browser;
const image=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>');
const fontName=(await readdir('assets/vendor')).find(name=>name.endsWith('.ttf'));const font=await readFile(join('assets/vendor',fontName));const hits={};let origin;
const external=createServer((req,res)=>{const path=new URL(req.url,origin).pathname;hits[path]=(hits[path]||0)+1;
 const send=(type,value)=>{res.setHeader('Content-Type',type);res.end(value);};
 if(path==='/style')return send('text/css',`@import './nested';@font-face{font-family:ProxyFont;src:url('./font')}h1{font-family:ProxyFont;background-image:url('./image')}`);
 if(path==='/nested')return send('text/css','h1{border-left:7px solid rgb(1, 2, 3)}');
 if(path==='/font')return send('font/ttf',font);
 if(path==='/image'||path==='/other-image')return send('image/svg+xml',image);
 if(path==='/redirect'){res.writeHead(302,{Location:'/image'});return res.end();}
 if(path==='/script')return send('text/javascript',`window.staticScript=true;const img=new Image();img.id='dynamic';img.src='${origin}/other-image';document.body.append(img);const script=document.createElement('script');script.src='${origin}/dynamic-script';document.head.append(script);const link=document.createElement('link');link.rel='stylesheet';link.href='${origin}/dynamic-style';document.head.append(link);fetch('${origin}/json').then(r=>r.json()).then(value=>window.fetchValue=value.ok);const xhr=new XMLHttpRequest();xhr.open('GET','${origin}/json');xhr.responseType='json';xhr.onload=()=>window.xhrValue=xhr.response.ok;xhr.send();const modulePath='${origin}/module';import(modulePath).then(module=>window.moduleValue=module.value);`);
 if(path==='/dynamic-script')return send('text/javascript','window.dynamicScript=true');
 if(path==='/dynamic-style')return send('text/css','h1{padding-right:19px}');
 if(path==='/module')return send('text/javascript',`import {value} from './dependency';export {value};`);
 if(path==='/dependency')return send('text/javascript','export const value=73;');
 if(path==='/json')return send('application/json','{"ok":true}');
 if(path==='/large')return send('application/octet-stream',Buffer.alloc(1300000,19));
 res.writeHead(404);res.end();
});await new Promise(done=>external.listen(0,'127.0.0.1',done));origin=`http://127.0.0.1:${external.address().port}`;
const original=`<!doctype html><html><head><link rel="stylesheet" href="${origin}/style" integrity="sha256-obsolete" crossorigin="anonymous"></head><body><h1>Proxy test</h1><img id="static" src="${origin}/redirect"><img id="responsive" srcset="${origin}/image 1x, ${origin}/other-image 2x"><div id="background" style="width:20px;height:20px;background-image:url('${origin}/image')"></div><script src="${origin}/script" integrity="sha256-obsolete"></script></body></html>`;
const file=join(folder,'site/index.html');await writeFile(file,original);const before=createHash('sha256').update(original).digest('hex');
const env={...process.env,WEBSITE_BUILDER_ROOT:folder,WEBSITE_BUILDER_PROJECT_ROOT:join(folder,'project'),WEBSITE_BUILDER_PROXY_ALLOW_LOCAL:'1'};
const client=new Client({name:'proxy-test',version:'1'});const transport=new StdioClientTransport({command:process.execPath,args:[resolve('dist/server/index.js')],env});
try{
 await client.connect(transport);
 const ui=await client.readResource({uri:'ui://codex-website-builder/canvas'});assert.deepEqual(ui.contents[0]._meta.ui.csp.resourceDomains,['data:','blob:']);
 let offset=0,size=0;while(size<1300000){const result=await client.callTool({name:'proxy_resource',arguments:{url:`${origin}/large`,offset}});assert.ok(!result.isError);const value=result._meta.resource;assert.ok(value.base64.length<750000);size+=Buffer.from(value.base64,'base64').length;offset=value.next;}assert.equal(size,1300000);assert.equal(hits['/large'],1);
 const failed=await client.callTool({name:'proxy_resource',arguments:{url:`${origin}/missing`}});assert.ok(failed.isError);
 preview=spawn(process.execPath,['dist/server/index.js','--preview'],{env,stdio:['ignore','pipe','pipe']});const url=await new Promise((done,reject)=>{preview.stdout.once('data',data=>done(data.toString().trim()));preview.once('error',reject);});
 browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();const direct=[],errors=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')console.log(message.text());});page.on('requestfailed',request=>console.log('requestfailed',request.url(),request.failure()));await page.route(`${origin}/**`,route=>{direct.push(route.request().url());return route.abort();});
 await page.route('**/canvas',async route=>{const response=await route.fetch();await route.fulfill({response,headers:{...response.headers(),'content-security-policy':`default-src 'self' blob: data:; script-src 'unsafe-inline' 'unsafe-eval' data: blob:; style-src 'unsafe-inline' data: blob:; img-src data: blob:; font-src data: blob:; connect-src http://127.0.0.1:${new URL(url).port} data: blob:; frame-src blob: data:;`}});});
 await page.goto(url.replace('localhost','127.0.0.1'));await page.getByRole('button',{name:'页面目录',exact:true}).click();await page.locator('#site-directory').fill('site');await page.getByRole('button',{name:'识别网站',exact:true}).click();
 const frame=page.frameLocator('iframe[title="index.html"]');try{await frame.locator('h1').waitFor({timeout:10000});}catch(error){console.log({body:await page.locator('body').innerText(),hits,errors});throw error;}
 await frame.locator('body').evaluate(()=>Promise.race([new Promise(resolve=>{const timer=setInterval(()=>{if(window.staticScript&&window.dynamicScript&&window.fetchValue&&window.xhrValue&&window.moduleValue===73){clearInterval(timer);resolve();}},50);}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Proxy script/fetch/XHR/module timeout')),10000))]));
 for(const id of ['static','dynamic','responsive'])try{await frame.locator('#'+id).evaluate(image=>new Promise((done,reject)=>{if(image.complete&&image.naturalWidth)return done();image.onload=done;image.onerror=()=>reject(new Error(image.id+' failed'));setTimeout(()=>image.naturalWidth?done():reject(new Error(image.id+' timed out')),5000);}));}catch(error){console.log(await frame.locator('#'+id).evaluate(image=>({html:image.outerHTML,currentSrc:image.currentSrc})),await page.locator('body').innerText(),hits);throw error;}
 await frame.locator('h1').evaluate(async el=>{await document.fonts.load('16px ProxyFont');if(getComputedStyle(el).borderLeftWidth!=='7px')throw new Error('nested CSS missing');if(getComputedStyle(el).paddingRight!=='19px')throw new Error('dynamic CSS missing');});
 assert.deepEqual(direct,[]);assert.deepEqual(errors,[]);assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),before);
 assert.ok(hits['/font']>0&&hits['/image']>0&&hits['/dependency']>0);
 const report={result:'PASS',checks:['arbitrary external image/srcset/background URLs','extensionless third-party scripts and CSS','nested CSS imports, fonts and images','dynamic images/scripts/styles','fetch and XMLHttpRequest through proxy','module imports and computed dynamic imports','chunked large binary transfer and cache deduplication','upstream errors reported','no direct browser CDN requests under strict CSP','website source hash unchanged'],hits,direct,errors};await mkdir('artifacts',{recursive:true});await writeFile('artifacts/proxy-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await client.close();if(browser)await browser.close();if(preview)preview.kill();await new Promise(done=>external.close(done));}
