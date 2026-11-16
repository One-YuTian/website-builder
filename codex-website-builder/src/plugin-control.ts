import {hostApp,hostReady} from './bridge';
export async function pluginControl(input:Record<string,unknown>):Promise<any>{
  if(hostApp){await hostReady;const result=await hostApp.callServerTool({name:'website_control',arguments:input},{timeout:600000});if(result.isError)throw Error(result.content?.filter(item=>item.type==='text').map(item=>'text'in item?item.text:'').join(' ')||'操作失败');return result._meta?.control;}
  const manager=window.__WEBSITE_BUILDER__?.managerApi;if(!manager)throw Error('请通过插件入口打开配置');
  const response=await fetch(manager.replace('/api/projects','/api/control'),{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(input)}),result=await response.json();if(!response.ok)throw Error(result.error||'操作失败');return result;
}
