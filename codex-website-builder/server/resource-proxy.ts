import http from 'node:http';
import https from 'node:https';
import { lookup } from 'node:dns';
import { isIP } from 'node:net';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib';
import { previewScript } from './snapshot';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';

type Resource = { bytes: Buffer; mime: string; url: string; status: number };
const maximum=64*1024*1024;
const privateAddress=(ip:string)=> /^(?:0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|22[4-9]\.|2[3-5]\d\.)/.test(ip)||ip.includes(':')&&(/^(?:::|f[cd]|fe[89ab])/i.test(ip)||ip.toLowerCase().includes('ffff:'));
const cache=new Map<string,{time:number;value:Promise<Resource>;size:number}>();
const previewPrefix='https://website-builder.invalid/preview-assets/';
const previewFiles=new Map<string,{file:string;mime:string;version:string}>();
const previewBuffers=new Map<string,{bytes:Buffer;mime:string}>();
export function registerPreviewBuffer(bytes:Buffer,mime:string) {
 const url=previewPrefix+createHash('sha256').update(mime).update(bytes).digest('hex');
 previewBuffers.delete(url);previewBuffers.set(url,{bytes,mime});
 let size=[...previewBuffers.values()].reduce((sum,item)=>sum+item.bytes.length,0);
 for(const [key,item]of previewBuffers){if(size<=128*1024*1024)break;if(key!==url){previewBuffers.delete(key);size-=item.bytes.length;}}
 return url;
}
export async function registerPreviewFile(file:string,mime:string) {
 const info=await stat(file),version=`${info.size}:${info.mtimeMs}`;
 const url=previewPrefix+createHash('sha256').update(file).update(version).digest('hex');
 previewFiles.set(url,{file,mime,version});
 if(previewFiles.size>8192)previewFiles.delete(previewFiles.keys().next().value!);
 return url;
}
const mimeByPath:Record<string,string>={js:'text/javascript',mjs:'text/javascript',css:'text/css',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',avif:'image/avif',gif:'image/gif',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',json:'application/json'};

function download(value:string,redirects=0):Promise<Resource>{
 const url=new URL(value);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('资源代理仅接受无凭据的 HTTP(S) 地址');
 if(redirects>6)throw new Error('资源重定向过多');
 const allowLocal=process.env.WEBSITE_BUILDER_PROXY_ALLOW_LOCAL==='1';
 if(!allowLocal&&(url.hostname==='localhost'||isIP(url.hostname.replace(/^\[|\]$/g,''))&&privateAddress(url.hostname.replace(/^\[|\]$/g,''))))throw new Error('外部资源代理不能访问本机或私有网络');
 return new Promise((resolve,reject)=>{
  const request=(url.protocol==='https:'?https:http).get(url,{headers:{'User-Agent':'Mozilla/5.0 WebsiteBuilderPreview/0.5.2','Accept':'*/*','Accept-Encoding':'gzip, deflate, br'},lookup:(hostname,options,callback)=>lookup(hostname,{...options,all:true},(error,addresses)=>{
   if(error)return callback(error,[] as any);
   if(!allowLocal&&addresses.some(item=>privateAddress(item.address)))return callback(new Error('外部资源地址解析到私有网络'),[] as any);
   if((options as any).all)(callback as any)(null,addresses);else (callback as any)(null,addresses[0].address,addresses[0].family);
  })},response=>{
   const status=response.statusCode||502;
   if(status>=300&&status<400&&response.headers.location){response.resume();download(new URL(response.headers.location,url).href,redirects+1).then(resolve,reject);return;}
   if(status<200||status>=300){response.resume();reject(new Error(`资源请求失败 (${status})：${url.href}`));return;}
   let size=0;const chunks:Buffer[]=[];
   response.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>maximum)response.destroy(new Error('资源超过 64MB 限制'));else chunks.push(chunk);});
   response.on('error',reject);response.on('end',()=>{try{let bytes=Buffer.concat(chunks);const encoding=response.headers['content-encoding'];const options={maxOutputLength:maximum};if(encoding==='gzip')bytes=gunzipSync(bytes,options);else if(encoding==='br')bytes=brotliDecompressSync(bytes,options);else if(encoding==='deflate')bytes=inflateSync(bytes,options);
    const mime=(response.headers['content-type']||mimeByPath[url.pathname.split('.').pop()||'']||'application/octet-stream').split(';')[0];resolve({bytes,mime,url:url.href,status});
   }catch(error){reject(error);}});
  });request.setTimeout(20000,()=>request.destroy(new Error(`资源请求超时：${url.href}`)));request.on('error',reject);
 });
}
const replaceAsync=async(text:string,pattern:RegExp,fn:(match:RegExpMatchArray)=>Promise<string>)=>{const matches=[...text.matchAll(pattern)],values=await Promise.all(matches.map(fn));let i=0;return text.replace(pattern,()=>values[i++]);};

export async function proxyResource(url:string,raw=false,chain:string[]=[]):Promise<Resource>{
 url=new URL(url).href;const key=`${raw?'raw':'compiled'}:${url}`;
 if(url.startsWith(previewPrefix)) {
  const buffer=previewBuffers.get(url);if(buffer)return{...buffer,url,status:200};
  const entry=previewFiles.get(url);if(!entry)throw new Error('预览资源已过期，请重新载入对应页面');
  const info=await stat(entry.file);if(`${info.size}:${info.mtimeMs}`!==entry.version)throw new Error('预览资源已更新，请重新载入对应页面');
  if(info.size>maximum)throw new Error('单个预览资源超过64MB限制');
  return{bytes:await readFile(entry.file),mime:entry.mime,url,status:200};
 }
 if(chain.includes(url))throw new Error(`资源循环依赖：${url}`);
 const existing=cache.get(key);if(existing&&Date.now()-existing.time<600000)return existing.value;
 const entry={time:Date.now(),size:0,value:Promise.resolve(null as unknown as Resource)};
 entry.value=(async()=>{
  const resource=await download(url);if(!raw){
   const embed=async(path:string)=>{if(/^(?:data:|blob:|#)/i.test(path))return path;const value=await proxyResource(new URL(path,resource.url).href,false,[...chain,url]);return `data:${value.mime};base64,${value.bytes.toString('base64')}`;};
   if(resource.mime==='text/css'){
    let css=resource.bytes.toString('utf8');
    css=await replaceAsync(css,/@import\s+(['"])([^'"]+)\1/gi,async match=>`@import url("${await embed(match[2])}")`);
    css=await replaceAsync(css,/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi,async match=>`url("${await embed(match[2])}")`);
    resource.bytes=Buffer.from(css);
   }else if(resource.mime==='image/svg+xml'){
    let svg=resource.bytes.toString('utf8');
    svg=await replaceAsync(svg,/\b((?:xlink:)?href)\s*=\s*(['"])([^'"]+)\2/gi,async match=>`${match[1]}=${match[2]}${await embed(match[3])}${match[2]}`);
    svg=await replaceAsync(svg,/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi,async match=>`url("${await embed(match[2])}")`);
    resource.bytes=Buffer.from(svg);
   }else if(/(?:java|ecma)script/.test(resource.mime)||/\.m?js$/i.test(new URL(resource.url).pathname)){
    let js=previewScript(resource.bytes.toString('utf8'),resource.url);
    // Modules lose their network base inside a data URI. Resolve dependencies at
    // the proxy, preserving import/export syntax and dynamic import expressions.
    js=await replaceAsync(js,/(\b(?:from\s*|import\s*(?:\(\s*)?|export\s+[^;]*?from\s*))(['"])([^'"]+)\2/g,async match=>{
     if(!/^(?:https?:|\/|\.)/.test(match[3]))return match[0];return `${match[1]}${match[2]}${await embed(match[3])}${match[2]}`;
    });
    js=js.replace(/\bimport\.meta\.url\b/g,JSON.stringify(resource.url));resource.bytes=Buffer.from(js);resource.mime='text/javascript';
   }
  }
  entry.size=resource.bytes.length;let size=[...cache.values()].reduce((sum,value)=>sum+value.size,0);for(const [key,value]of cache){if(size<128*1024*1024)break;if(value!==entry){cache.delete(key);size-=value.size;}}return resource;
 })().catch(error=>{cache.delete(key);throw error;});cache.set(key,entry);return entry.value;
}

export async function resourceChunk(url:string,offset=0,raw=false){
 const resource=await proxyResource(url,raw);const bytes=resource.bytes.subarray(offset,offset+512*1024);
 return{base64:bytes.toString('base64'),mime:resource.mime,url:resource.url,status:resource.status,total:resource.bytes.length,offset,next:offset+bytes.length};
}
