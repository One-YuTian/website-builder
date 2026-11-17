import { hostApp, hostReady } from './bridge';
export async function uploadPromptFiles(request:(input:Record<string,unknown>)=>Promise<any>,requestId:string,files:File[],signal:AbortSignal) {
  const uploaded=[];
  for(const file of files){
    if(signal.aborted)throw Error('附件上传已取消');
    const bytes=new Uint8Array(await file.arrayBuffer());
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),byte=>byte.toString(16).padStart(2,'0')).join('');
    const id=crypto.randomUUID();let result;
    for(let offset=0;offset<bytes.length||offset===0;offset+=192*1024){
      if(signal.aborted)throw Error('附件上传已取消');
      const chunk=bytes.subarray(offset,Math.min(offset+192*1024,bytes.length));
      let binary='';for(let start=0;start<chunk.length;start+=8192)binary+=String.fromCharCode(...chunk.subarray(start,start+8192));
      result=await request({action:'upload',request_id:requestId,upload_id:id,file_name:file.name,mime_type:file.type||'application/octet-stream',total_size:bytes.length,sha256:digest,offset,chunk:btoa(binary),final:offset+chunk.length===bytes.length});
    }
    if(!result?.complete)throw Error(`附件 ${file.name} 未完整保存`);
    uploaded.push({upload_id:id,name:result.name,mime:file.type||'application/octet-stream',size:bytes.length});
  }
  return uploaded;
}
export async function manageProjects(input: Record<string, unknown>) {
  if(hostApp) {
    await hostReady;
    const result=await hostApp.callServerTool({name:'website_projects',arguments:input},{timeout:90000});
    if(result.isError)throw Error(result.content?.filter(item=>item.type==='text').map(item=>'text' in item?item.text:'').join(' ')||'项目操作失败');
    return result._meta?.manager as any;
  }
  const api=window.__WEBSITE_BUILDER__?.managerApi;
  if(!api)throw Error('请通过插件入口打开项目面板');
  // Standalone canvas is intentionally served on localhost while its token API
  // uses 127.0.0.1. A safelisted content type avoids an unnecessary preflight.
  const response=await fetch(api,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(input)});
  const result=await response.json();if(!response.ok)throw Error(result.error||'项目操作失败');return result;
}
