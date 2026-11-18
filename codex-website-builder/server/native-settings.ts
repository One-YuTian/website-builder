import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {PluginSettings} from './plugin-settings';
import {r2Fields,type R2Settings} from './r2-settings';
export const settingsCapability={readTool:'website_settings_read',updateTool:'website_settings_update'};
const defaultTestDescription='只读测试已保存配置的网络、TLS、身份、分组和部署仓库，不发布网站';
const gitlabKeys=['GITLAB_HOST','GITLAB_IP','GITLAB_TOKEN','GITLAB_WEBSITE_DIR','GITLAB_WEBSITE_DEPLOY_DIR','GITLAB_DEFAULT_BRANCH'] as const;
export function registerNativeSettings(server:McpServer,settings:PluginSettings,save:(values:Record<string,unknown>)=>Promise<any>,test:(values?:Record<string,string>)=>Promise<any>,r2Settings?:R2Settings){
 const output={schema:z.record(z.string(),z.unknown()),values:z.record(z.string(),z.unknown()),layout:z.array(z.record(z.string(),z.unknown())).optional()};
 let testDescription=defaultTestDescription;
 const read=async()=>{
  const value:Record<string,any>=await settings.public(true);
  const r2Value:Record<string,any>=r2Settings?await r2Settings.public():{};
  const r2Properties:Record<string,unknown>=r2Settings?Object.fromEntries(r2Fields.map(name=>[name,{type:'string',title:name,readOnly:true}])):{};
  const gitlabProperties:Record<string,unknown>={
   GITLAB_HOST:{type:'string',title:'GITLAB_HOST',description:'内网 HTTP 服务填写 http://域名或IP:端口；不带协议默认 HTTP，只有支持 HTTPS 时才填 https://'},GITLAB_IP:{type:'string',title:'GITLAB_IP',description:'需 OPEN VPN 连通的 IP；协议和端口在 GITLAB_HOST 中填写'},
   GITLAB_TOKEN:{type:'string',title:'GITLAB_TOKEN',description:'GitLab Token，明文保存并回显；清空后保存可删除'},
   GITLAB_WEBSITE_DIR:{type:'string',title:'GITLAB_WEBSITE_DIR',description:'官网分组地址'},GITLAB_WEBSITE_DEPLOY_DIR:{type:'string',title:'GITLAB_WEBSITE_DEPLOY_DIR',description:'部署仓库地址'},
   GITLAB_DEFAULT_BRANCH:{type:'string',title:'GITLAB_DEFAULT_BRANCH',description:'部署仓库基准分支'},
  };
  const properties={...r2Properties,...gitlabProperties};
  const values={
   ...Object.fromEntries(Object.keys(r2Properties).map(key=>[key,r2Value[key]||''])),
   ...Object.fromEntries(Object.keys(gitlabProperties).map(key=>[key,value[key]||''])),
  };
  const layout:Array<Record<string,unknown>>=[];
  if(r2Settings)layout.push({kind:'group',title:'预览环境配置',items:r2Fields.map(property=>({kind:'property',property}))});
  layout.push({kind:'group',title:'线上部署配置',items:[...Object.keys(gitlabProperties).map(property=>({kind:'property',property})),{kind:'tool',tool:'website_settings_test',description:testDescription}]});
  return {schema:{type:'object',properties},values,layout};
 };
 server.registerTool('website_settings_test',{title:'测试连接',inputSchema:{},outputSchema:{success:z.boolean(),message:z.string(),checks:z.array(z.object({name:z.string(),status:z.enum(['pending','passed','failed','skipped']),detail:z.string()}))},annotations:{readOnlyHint:true,openWorldHint:true},_meta:{ui:{visibility:['app']}}},async()=>{
  const result=await test();
  const failed=result.checks?.find((item:any)=>item.status==='failed');
  testDescription=result.success?'测试连接成功：网络、身份与部署仓库检查通过':`测试连接失败（${failed?.name||'检查异常'}）：${failed?.detail||result.message}`;
  return {content:[{type:'text',text:testDescription}],structuredContent:result};
 });
 server.registerTool(settingsCapability.readTool,{title:'读取插件配置',inputSchema:{},outputSchema:output,annotations:{readOnlyHint:true,openWorldHint:false},_meta:{ui:{visibility:['app']}}},async()=>({content:[],structuredContent:await read()}));
 server.registerTool(settingsCapability.updateTool,{title:'更新插件配置',inputSchema:{set:z.object({GITLAB_HOST:z.string().optional(),GITLAB_IP:z.string().optional(),GITLAB_TOKEN:z.string().max(8192).optional(),GITLAB_WEBSITE_DIR:z.string().optional(),GITLAB_WEBSITE_DEPLOY_DIR:z.string().optional(),GITLAB_DEFAULT_BRANCH:z.string().optional()}).passthrough()},outputSchema:{values:z.record(z.string(),z.unknown())},annotations:{readOnlyHint:false,openWorldHint:false},_meta:{ui:{visibility:['app']}}},async({set})=>{try{const filtered=Object.fromEntries(gitlabKeys.filter(key=>key in set&&typeof set[key]==='string').map(key=>[key,set[key]]));await save(filtered);testDescription=defaultTestDescription;return {content:[],structuredContent:{values:(await read()).values}};}catch(error){return {isError:true,content:[{type:'text',text:(error as Error).message}]};}});
 return async()=>{
  const capabilities=server.server.getClientCapabilities();
  if(!capabilities?.elicitation||capabilities.elicitation.url&&!capabilities.elicitation.form)throw Error('当前宿主不支持插件级配置弹窗，请在 Codex 的插件设置中打开 Website Builder 配置。');
  const current=await read();
  let draft={...current.values},message='线上部署配置。选择保存配置，或先测试连接（不保存）。';
  for(;;){
   const source=current.schema.properties as Record<string,any>;
   const editable=Object.fromEntries(Object.entries(source).filter(([name])=>(gitlabKeys as readonly string[]).includes(name)).map(([name,value])=>[name,{...value,default:draft[name]}]));
   editable.operation={type:'string',title:'操作',enum:['save','test'],enumNames:['保存配置','测试连接（不保存）'],default:'save'};
   const answer=await server.server.elicitInput({...(capabilities.elicitation.form?{mode:'form'}:{}),message,requestedSchema:{type:'object',properties:editable}} as any,{timeout:600000});
   if(answer.action!=='accept')return {cancelled:true};
   const input=answer.content||{};
   draft={...draft,...Object.fromEntries(Object.entries(input).filter(([key,value])=>(gitlabKeys as readonly string[]).includes(key)&&typeof value==='string'))};
   const values=Object.fromEntries(gitlabKeys.map(key=>[key,String(draft[key]||'')])) as Record<string,string>;
   try{
    if(input.operation==='test'){
     const report=await test(values);
     const failed=report.checks?.find((item:any)=>item.status==='failed');
     message=(report.success?'测试连接成功：网络、身份与部署仓库检查通过':`测试连接失败（${failed?.name||'检查异常'}）：${failed?.detail||report.message}`)+'\n测试不会保存配置；选择保存配置后提交，或取消关闭。';
    }else{await save(values);return {saved:true};}
   }catch(error){message=(error as Error).message+'\n请修改配置后重新提交，或取消关闭。';}
  }
 };
}
