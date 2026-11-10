import {hostApp,hostReady} from './bridge';
const cache=new Map<string,Promise<{data:string;mime:string;status:number}>>();
export function readResource(url:string,raw=false){
 const key=`${raw}:${url}`;const saved=cache.get(key);if(saved)return saved;
 const pending=(async()=>{
  await hostReady;let offset=0,total=Infinity,mime='',status=200;const chunks:string[]=[];
  while(offset<total){let value:any;
   if(hostApp){const result=await hostApp.callServerTool({name:'proxy_resource',arguments:{url,offset,raw}},{timeout:60000});if(result.isError)throw new Error(result.content?.filter(item=>item.type==='text').map(item=>'text'in item?item.text:'').join(' ')||'资源代理失败');value=result._meta?.resource;}
   else{const api=window.__WEBSITE_BUILDER__?.resourceApi;if(!api)throw new Error('资源代理未连接');const target=new URL(api);target.searchParams.set('url',url);target.searchParams.set('offset',String(offset));target.searchParams.set('raw',String(raw));const response=await fetch(target);value=await response.json();if(!response.ok)throw new Error(value.error||'资源代理失败');}
   if(!value||value.next<=offset&&value.total>0)throw new Error('资源代理返回无效分片');
   chunks.push(atob(value.base64));offset=value.next;total=value.total;mime=value.mime;status=value.status;
  }
  // Re-encode once, since arbitrary chunk sizes need not be base64-aligned.
  return{data:`data:${mime};base64,${btoa(chunks.join(''))}`,mime,status};
 })().catch(error=>{cache.delete(key);throw error;});cache.set(key,pending);
 // Avoid keeping binaries indefinitely in a long-lived canvas.
 if(cache.size>128)cache.delete(cache.keys().next().value!);
 return pending;
}
