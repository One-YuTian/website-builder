import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {PluginSettings} from './plugin-settings';
export const settingsCapability={readTool:'website_settings_read',updateTool:'website_settings_update'};
export function registerNativeSettings(server:McpServer,settings:PluginSettings,save:(values:Record<string,unknown>)=>Promise<any>,test:(values?:Record<string,string>)=>Promise<any>){
 const output={schema:z.record(z.string(),z.unknown()),values:z.record(z.string(),z.unknown()),layout:z.array(z.record(z.string(),z.unknown())).optional()};
 const read=async()=>{
  const value:Record<string,any>=await settings.public(true);
  const properties:Record<string,unknown>={
   PROJECT_DIR:{type:'string',title:'PROJECT_DIR',description:'自动资源目录，不能更改；任何修改都会恢复',enum:[value.PROJECT_DIR]},
   GITLAB_HOST:{type:'string',title:'GITLAB_HOST',description:'内网 HTTP 服务填写 http://域名或IP:端口；不带协议默认 HTTP，只有支持 HTTPS 时才填 https://'},GITLAB_IP:{type:'string',title:'GITLAB_IP',description:'需 OPEN VPN 连通的 IP；协议和端口在 GITLAB_HOST 中填写'},
   GITLAB_TOKEN:{type:'string',title:'GITLAB_TOKEN',description:'GitLab Token，明文保存并回显；清空后保存可删除'},
   GITLAB_WEBSITE_DIR:{type:'string',title:'GITLAB_WEBSITE_DIR',description:'官网分组地址'},GITLAB_WEBSITE_DEPLOY_DIR:{type:'string',title:'GITLAB_WEBSITE_DEPLOY_DIR',description:'部署仓库地址'},
   GITLAB_DEFAULT_BRANCH:{type:'string',title:'GITLAB_DEFAULT_BRANCH',description:'部署仓库基准分支'},
  };
  return {schema:{type:'object',properties},values:Object.fromEntries(Object.keys(properties).map(key=>[key,value[key]||''])),layout:[{kind:'group',title:'Website Builder 配置',items:[...Object.keys(properties).map(property=>({kind:'property',property})),{kind:'tool',tool:'website_settings_test',description:'只读测试已保存配置的网络、TLS、身份、分组和部署仓库，不发布网站'}]}]};
 };
 server.registerTool('website_settings_test',{title:'测试连接',inputSchema:{},outputSchema:{success:z.boolean(),message:z.string(),checks:z.array(z.object({name:z.string(),status:z.enum(['pending','passed','failed','skipped']),detail:z.string()}))},annotations:{readOnlyHint:true,openWorldHint:true},_meta:{ui:{visibility:['app']}}},async()=>{const result=await test();return {content:[{type:'text',text:[result.message,...result.checks.map((item:any)=>`${item.name} · ${item.status==='passed'?'通过':item.status==='failed'?'失败':'未执行'}：${item.detail}`)].join('\n')}],structuredContent:result};});
 server.registerTool(settingsCapability.readTool,{title:'读取插件配置',inputSchema:{},outputSchema:output,annotations:{readOnlyHint:true,openWorldHint:false},_meta:{ui:{visibility:['app']}}},async()=>({content:[],structuredContent:await read()}));
 server.registerTool(settingsCapability.updateTool,{title:'更新插件配置',inputSchema:{set:z.object({PROJECT_DIR:z.string().optional(),GITLAB_HOST:z.string().optional(),GITLAB_IP:z.string().optional(),GITLAB_TOKEN:z.string().max(8192).optional(),GITLAB_WEBSITE_DIR:z.string().optional(),GITLAB_WEBSITE_DEPLOY_DIR:z.string().optional(),GITLAB_DEFAULT_BRANCH:z.string().optional()}).strict()},outputSchema:{values:z.record(z.string(),z.unknown())},annotations:{readOnlyHint:false,openWorldHint:false},_meta:{ui:{visibility:['app']}}},async({set})=>{try{await save(set);return {content:[],structuredContent:{values:(await read()).values}};}catch(error){return {isError:true,content:[{type:'text',text:(error as Error).message}]};}});
 return async()=>{
  const capabilities=server.server.getClientCapabilities();
  if(!capabilities?.elicitation||capabilities.elicitation.url&&!capabilities.elicitation.form)throw Error('当前宿主不支持插件级配置弹窗，请在 Codex 的插件设置中打开 Website Builder 配置。');
  let draft=(await read()).values,message='Website Builder 插件配置。资源目录由插件管理，无法修改。选择保存配置，或先测试连接（不保存）。';
  for(;;){
   const source=(await read()).schema.properties as Record<string,any>;
   const properties=Object.fromEntries(Object.entries(source).map(([name,value])=>[name,{...value,default:draft[name]}]));
   properties.operation={type:'string',title:'操作',enum:['save','test'],enumNames:['保存配置','测试连接（不保存）'],default:'save'};
   const answer=await server.server.elicitInput({...(capabilities.elicitation.form?{mode:'form'}:{}),message,requestedSchema:{type:'object',properties}} as any,{timeout:600000});
   if(answer.action!=='accept')return {cancelled:true};
   const input=answer.content||{};
   draft={...draft,...Object.fromEntries(Object.entries(input).filter(([key,value])=>key in source&&typeof value==='string')),PROJECT_DIR:source.PROJECT_DIR.enum[0]};
   const values=Object.fromEntries(Object.entries(draft).filter(([key])=>key!=='PROJECT_DIR')) as Record<string,string>;
   try{
    if(input.operation==='test'){
     const report=await test(values);
     message=[report.message,...report.checks.map((item:any)=>`${item.name}：${item.detail}`),'测试不会保存配置；选择保存配置后提交，或取消关闭。'].join('\n');
    }else{await save(values);return {saved:true};}
   }catch(error){message=(error as Error).message+'\n请修改配置后重新提交，或取消关闭。';}
  }
 };
}
