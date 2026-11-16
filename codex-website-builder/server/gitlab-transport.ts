import http from 'node:http';
import https from 'node:https';
import {connect,isIP} from 'node:net';
import {once} from 'node:events';
import {connect as connectTLS,checkServerIdentity} from 'node:tls';
import type {GitLabSettings} from './plugin-settings';

export function gitlabHost(value:string){
  const address=value.trim();
  const url=new URL(address.includes('://')?address:`http://${address}`);
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw Error('GITLAB_HOST 必须是无凭据的 HTTP(S) 地址');
  return url.href.replace(/\/$/,'');
}
export function gitlabPath(value:string,host:string){
  let path=value.trim();
  if(path.includes('://')){const url=new URL(path),base=new URL(host);if(url.origin!==base.origin||url.username||url.password||url.search||url.hash)throw Error('GitLab 地址必须属于配置的 HOST');path=url.pathname;if(base.pathname!=='/'){if(!path.startsWith(base.pathname+'/'))throw Error('GitLab 路径不属于 HOST');path=path.slice(base.pathname.length);}}
  path=path.replace(/^\/+|\/+$/g,'').replace(/\.git$/,'');
  if(!path||path.split('/').some(part=>!part||part==='.'||part==='..'||!/^[\w.-]+$/.test(part)))throw Error('GitLab 分组或仓库路径无效');return path;
}
export function gitlabGroupPath(value:string,host:string){
  const path=gitlabPath(value,host);
  return value.includes('://')?path.replace(/^groups\//,'').replace(/\/-\/(?:projects|activity|details)$/,''):path;
}
export function gitlabNetworkError(error:unknown,settings:GitLabSettings){
  const original=error as NodeJS.ErrnoException,detail=String(original?.message||error).replaceAll(settings.GITLAB_TOKEN||'\u0000','[REDACTED]');
  if(original?.name==='AbortError')return original;
  if(/^TLS 连接失败：|^TLS\/证书校验失败：/.test(detail))return Object.assign(Error(detail),{code:original?.code});
  let message=detail;
  if(/EPROTO|SSL|TLS|CERT_|CERTIFICATE|SELF_SIGNED|UNABLE_TO_VERIFY|UNABLE_TO_GET_ISSUER/i.test((original?.code||'')+' '+detail)){
    message=/internal.error|alert number 80|0A000438/i.test(detail)
      ?'TLS 连接失败：对端返回 internal_error（alert 80），未得到有效的 GitLab API 响应，不能据此判断 Token 是否有效。若内网服务只支持 HTTP，请将 GITLAB_HOST 改为 http://域名或IP:端口（不是 https://）；同时核对 IP、端口与服务端配置。'
      :'TLS/证书校验失败：请核对 HOST 域名、IP、端口与证书名称/证书链；内部 CA 需由运行插件的 Node 环境信任。';
    message+=' 原始错误：'+detail;
  }else if(/ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH|ECONNRESET/.test(original?.code||''))message='GitLab 网络连接失败，请检查 OPEN VPN、IP 和端口。原始错误：'+detail;
  return Object.assign(Error(message),{code:original?.code});
}
const hostName=(url:URL)=>url.hostname.replace(/^\[|\]$/g,'');
export interface GitLabIO {probe(settings:GitLabSettings,signal?:AbortSignal):Promise<void>;tls?(settings:GitLabSettings,signal?:AbortSignal):Promise<string>;api(settings:GitLabSettings,method:string,path:string,body?:unknown,signal?:AbortSignal):Promise<{status:number;data:any}>;http(settings:GitLabSettings,signal?:AbortSignal):{request(input:any):Promise<any>};}
export function nodeGitLabIO():GitLabIO {
  const request=async(settings:GitLabSettings,input:any)=>{
    const host=gitlabHost(settings.GITLAB_HOST),url=new URL(input.url);
    if(!url.href.startsWith(host+'/')||url.username||url.password)throw Error('拒绝向其他地址发送 GitLab 凭据');
    if(!isIP(settings.GITLAB_IP))throw Error('GITLAB_IP 需要有效 IP 地址');
    return new Promise<any>((resolve,reject)=>{
      const name=hostName(url);
      const req=(url.protocol==='https:'?https:http).request(url,{method:input.method||'GET',hostname:settings.GITLAB_IP,headers:{...input.headers,Host:url.host},servername:isIP(name)?undefined:name,checkServerIdentity:(_server,cert)=>checkServerIdentity(name,cert),rejectUnauthorized:true,signal:input.signal},res=>{
        if((res.statusCode||0)>=300&&(res.statusCode||0)<400){res.resume();reject(Error('GitLab 返回重定向；请使用最终 HOST 地址，未转发凭据'));return;}
        resolve({url:url.href,statusCode:res.statusCode,statusMessage:res.statusMessage,headers:res.headers,body:res});
      });
      req.setTimeout(120000,()=>req.destroy(Error('GitLab 请求超时，请检查 OPEN VPN 连接')));req.on('error',error=>reject(gitlabNetworkError(error,settings)));
      void(async()=>{try{if(input.body)for await(const chunk of typeof input.body==='string'||ArrayBuffer.isView(input.body)?[input.body]:input.body)if(!req.write(chunk))await once(req,'drain');req.end();}catch(error){req.destroy(error as Error);}})();
    });
  };
  return {
    tls:async(settings,signal)=>{
      const url=new URL(gitlabHost(settings.GITLAB_HOST)),name=hostName(url);
      if(url.protocol!=='https:')return 'HTTP，无 TLS 握手';
      if(!isIP(settings.GITLAB_IP))throw Error('GITLAB_IP 需要有效 IP 地址');
      signal?.throwIfAborted();
      return new Promise<string>((resolve,reject)=>{
        const socket=connectTLS({host:settings.GITLAB_IP,port:Number(url.port)||443,servername:isIP(name)?undefined:name,checkServerIdentity:(_server,cert)=>checkServerIdentity(name,cert),rejectUnauthorized:true});
        const abort=()=>socket.destroy(Object.assign(Error('连接测试已取消'),{name:'AbortError'}));signal?.addEventListener('abort',abort,{once:true});socket.once('close',()=>signal?.removeEventListener('abort',abort));
        socket.setTimeout(10000,()=>socket.destroy(Error('TLS 握手超时，请检查 HTTPS 端口和反向代理配置')));
        socket.once('secureConnect',()=>{const protocol=socket.getProtocol();socket.destroy();resolve(`${protocol}，证书与域名校验通过`);});
        socket.once('error',error=>reject(gitlabNetworkError(error,settings)));
      });
    },
    probe:async (settings,signal)=>{
      if(!isIP(settings.GITLAB_IP))throw Error('请填写有效 GITLAB_IP 并检查 OPEN VPN 连接');
      const url=new URL(gitlabHost(settings.GITLAB_HOST));
      await new Promise<void>((resolve,reject)=>{const socket=connect({host:settings.GITLAB_IP,port:Number(url.port)||(url.protocol==='https:'?443:80),signal});socket.setTimeout(5000);socket.once('connect',()=>{socket.destroy();resolve();});socket.once('timeout',()=>socket.destroy(Error('连接超时')));socket.once('error',()=>reject(Error('GITLAB_IP 无法连通，请检查 OPEN VPN 连接')));});
    },
    api:async(settings,method,path,body,signal)=>{
      const result=await request(settings,{url:gitlabHost(settings.GITLAB_HOST)+'/api/v4'+path,method,signal,headers:{Accept:'application/json','PRIVATE-TOKEN':settings.GITLAB_TOKEN,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
      const buffers=[];let size=0;for await(const chunk of result.body){size+=chunk.length;if(size>8*1024*1024)throw Error('GitLab API 响应过大');buffers.push(chunk);}
      let data;try{data=JSON.parse(Buffer.concat(buffers).toString());}catch{throw Error('GitLab API 未返回 JSON');}return {status:result.statusCode,data};
    },
    http:(settings,signal)=>({request:input=>request(settings,{...input,signal:signal||input.signal})}),
  };
}
