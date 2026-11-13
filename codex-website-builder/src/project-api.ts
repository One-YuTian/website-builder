import { hostApp, hostReady } from './bridge';
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
