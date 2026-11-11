import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, cp, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
const root=await mkdtemp(join(tmpdir(),'website-cdn-')),hits={};
const upstream=createServer((req,res)=>{
 hits[req.url]=(hits[req.url]||0)+1;
 if(req.url==='/library.js'){res.setHeader('Content-Type','text/javascript');res.end('window.loadedFromOnlineCDN=true;');}
 else if(req.url==='/font.css'){res.setHeader('Content-Type','text/css');res.end('@font-face{font-family:Brand;src:url("/brand.woff2")}');}
 else if(req.url==='/brand.woff2'){res.setHeader('Content-Type','font/woff2');res.end(Buffer.from('test-font-from-upstream'));}
 else res.writeHead(404).end();
});
await new Promise(resolve=>upstream.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${upstream.address().port}`;
const client=new Client({name:'online-cdn-test',version:'1'});
try{
 await cp('dist',join(root,'dist'),{recursive:true});await writeFile(join(root,'package.json'),JSON.stringify({type:'module'}));
 const vendor=join(root,'dist/vendor'),manifest=JSON.parse(await readFile(join(vendor,'manifest.json'),'utf8'));
 // Conflicting bundled replacements must not override online sources by default.
 manifest[origin+'/library.js']='jquery.js';manifest[origin+'/font.css']='swiper.css';
 await writeFile(join(vendor,'manifest.json'),JSON.stringify(manifest));
 await mkdir(join(root,'sites/site'),{recursive:true});
 const source=`<!doctype html><html><head><link rel="stylesheet" href="${origin}/font.css"><script src="${origin}/library.js"></script></head><body>CDN</body></html>`;
 await writeFile(join(root,'sites/site/index.html'),source);
 await client.connect(new StdioClientTransport({command:process.execPath,args:[join(root,'dist/server/index.js')],cwd:root,env:{...process.env,WEBSITE_BUILDER_PREVIEW_VENDOR_FIXTURES:'0',WEBSITE_BUILDER_PROXY_ALLOW_LOCAL:'1',WEBSITE_BUILDER_ROOT:join(root,'sites'),WEBSITE_BUILDER_PROJECT_ROOT:join(root,'project'),WEBSITE_BUILDER_SKILL_ROOT:resolve('skills/website-builder')}}));
 const result=await client.callTool({name:'read_page',arguments:{directory:'site',path:'index.html'}});assert.ok(!result.isError,JSON.stringify(result));
 const html=gunzipSync(Buffer.from(result._meta.gzip,'base64')).toString();
 const scripts=[...html.matchAll(/data:text\/javascript;base64,([^"']+)/g)].map(match=>Buffer.from(match[1],'base64').toString());
 assert.ok(scripts.some(script=>script.includes('window.loadedFromOnlineCDN=true')));
 assert.equal(hits['/library.js'],1);assert.equal(hits['/font.css'],1);assert.equal(hits['/brand.woff2'],1);
 assert.equal(await readFile(join(root,'sites/site/index.html'),'utf8'),source);
 const report={result:'PASS',checks:['default preview fetches online library despite a conflicting bundled mapping','online font stylesheet and font binary loaded upstream','production CDN source URLs unchanged'],hits};
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/cdn-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await client.close();upstream.closeAllConnections();upstream.close();}
