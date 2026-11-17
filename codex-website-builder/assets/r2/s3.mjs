// Standalone S3 protocol client. No AWS SDK or npm runtime dependencies.
import {createHash,createHmac} from 'node:crypto';
import http from 'node:http';
import https from 'node:https';
import {once} from 'node:events';
const sha=value=>createHash('sha256').update(value).digest('hex');
const mac=(key,value)=>createHmac('sha256',key).update(value).digest();
export const awsEncode=value=>encodeURIComponent(value).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
export function signS3({url,method,headers={},payloadHash=sha(''),accessKeyId,secretAccessKey,date=new Date(),region='auto'}){
 const timestamp=date.toISOString().replace(/[:-]|\.\d{3}/g,''),day=timestamp.slice(0,8),scope=day+'/'+region+'/s3/aws4_request';
 const values={...headers,host:url.host,'x-amz-date':timestamp,'x-amz-content-sha256':payloadHash};
 const canonicalHeaders=Object.fromEntries(Object.entries(values).map(([key,value])=>[key.toLowerCase(),String(value).trim().replace(/\s+/g,' ')]));
 const names=Object.keys(canonicalHeaders).sort(),query=[...url.searchParams].map(([key,value])=>[awsEncode(key),awsEncode(value)]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:a[1]<b[1]?-1:a[1]>b[1]?1:0).map(pair=>pair.join('=')).join('&');
 const canonical=[method,url.pathname,query,names.map(name=>name+':'+canonicalHeaders[name]+'\n').join(''),names.join(';'),payloadHash].join('\n');
 const signingKey=mac(mac(mac(mac('AWS4'+secretAccessKey,day),region),'s3'),'aws4_request');
 const signature=mac(signingKey,['AWS4-HMAC-SHA256',timestamp,scope,sha(canonical)].join('\n')).toString('hex');
 return {...values,Authorization:`AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${names.join(';')}, Signature=${signature}`};
}
const xmlDecode=value=>value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi,(_,code)=>code[0]==='#'?String.fromCodePoint(code[1].toLowerCase()==='x'?parseInt(code.slice(2),16):Number(code.slice(1))):({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"})[code.toLowerCase()]);
const tag=(xml,name)=>{const value=xml.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+name+'>'));return value?xmlDecode(value[1]):'';};
export function parseList(xml){
 if(!/<ListBucketResult\b/.test(xml)||/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('S3 列表响应格式无效');
 const objects=[...xml.matchAll(/<Contents(?:\s[^>]*)?>([\s\S]*?)<\/Contents>/g)].map(match=>({key:tag(match[1],'Key'),size:Number(tag(match[1],'Size'))}));
 if(objects.some(item=>!item.key||!Number.isSafeInteger(item.size)||item.size<0))throw Error('S3 列表包含无效对象');
 const truncated=tag(xml,'IsTruncated');if(!['true','false'].includes(truncated))throw Error('S3 列表缺少分页状态');
 const next=tag(xml,'NextContinuationToken');if(truncated==='true'&&!next)throw Error('S3 分页标记缺失');return {objects,next:truncated==='true'?next:''};
}
export async function nodeRequest({url,method,headers,body,signal,size,onProgress}){
 return new Promise((resolve,reject)=>{
  const request=(url.protocol==='https:'?https:http).request(url,{method,headers:{...headers,...(size!==undefined?{'Content-Length':String(size)}:{})},signal},response=>{
   if(response.statusCode>=300&&response.statusCode<400){response.resume();reject(Error('S3 返回重定向，未转发凭据'));return;}
   const chunks=[];let length=0;response.on('data',chunk=>{length+=chunk.length;if(length>8*1024*1024)response.destroy(Error('S3 响应过大'));else chunks.push(chunk);});response.on('error',reject);response.on('end',()=>resolve({status:response.statusCode,headers:response.headers,text:Buffer.concat(chunks).toString()}));
  });
  request.setTimeout(120000,()=>request.destroy(Error('S3 请求超时')));request.on('error',reject);
  void(async()=>{try{let sent=0;if(body)for await(const chunk of typeof body==='string'||Buffer.isBuffer(body)?[body]:body){signal?.throwIfAborted();if(!request.write(chunk))await once(request,'drain');sent+=chunk.length;onProgress?.(sent);}request.end();}catch(error){request.destroy(error);}})();
 });
}
export function createS3Client(config,{endpoint=`https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,request=nodeRequest,now=()=>new Date()}={}){
 const base=new URL(endpoint);if(base.protocol!=='https:'&&!(base.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(base.hostname)))throw Error('R2 必须使用 HTTPS');
 const redact=value=>String(value).replaceAll(config.R2_SECRET_ACCESS_KEY||'\u0000','[REDACTED]').replaceAll(config.R2_ACCESS_KEY_ID||'\u0000','[REDACTED]');
 const call=async(method,key='',query={},options={})=>{
  if(key.split('/').some(part=>part==='.'||part==='..')||/[\\\x00-\x1f]/.test(key))throw Error('S3 对象路径无效');
  const url=new URL(base);url.pathname='/'+[config.R2_BUCKET_NAME,...key.split('/')].map(awsEncode).join('/');if(!key)url.pathname=url.pathname.replace(/\/$/,'');
  for(const [name,value] of Object.entries(query))url.searchParams.set(name,value);
  const headers=signS3({url,method,headers:options.headers,payloadHash:options.sha256,accessKeyId:config.R2_ACCESS_KEY_ID,secretAccessKey:config.R2_SECRET_ACCESS_KEY,date:now()});
  try{const result=await request({url,method,...options,headers});if(result.status<200||result.status>=300)throw Error(`S3 ${method} HTTP ${result.status} ${tag(result.text||'','Code')}`);return result;}catch(error){throw Error(redact(error.message||error));}
 };
 return {
  async list(prefix,signal){const all=[],seen=new Set();let token='';do{signal?.throwIfAborted();const result=parseList((await call('GET','',{'list-type':'2',prefix,...(token?{'continuation-token':token}:{})},{signal})).text);for(const item of result.objects){if(!item.key.startsWith(prefix)||seen.has(item.key))throw Error('S3 列表前缀越界或重复');seen.add(item.key);all.push(item);}if(result.next===token&&token)throw Error('S3 分页循环');token=result.next;}while(token);return all;},
  async put(key,file,signal,onProgress){return call('PUT',key,{}, {body:file.body,size:file.size,sha256:file.sha256,signal,onProgress,headers:{'content-type':file.contentType,'x-amz-meta-sha256':file.sha256}});},
  async head(key,signal){const result=await call('HEAD',key,{}, {signal});return {size:Number(result.headers['content-length']),sha256:result.headers['x-amz-meta-sha256']||''};},
  async remove(key,signal){await call('DELETE',key,{}, {signal});},
 };
}
