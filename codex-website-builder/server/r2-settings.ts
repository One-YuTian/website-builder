import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {r2Config,r2Fields,type R2Config} from './r2-config';
export {r2Fields,type R2Config} from './r2-config';
const mask='••••••••';
export class R2Settings {
 constructor(readonly root:string,_env=process.env){}
 async get():Promise<R2Config>{
  return {...r2Config};
 }
 async public(){const data=await this.get();return {...data,R2_ACCESS_KEY_ID:data.R2_ACCESS_KEY_ID?mask:'未配置',R2_SECRET_ACCESS_KEY:data.R2_SECRET_ACCESS_KEY?mask:'未配置'};}
}
export const r2SettingsCapability={readTool:'website_s3_settings_read',updateTool:'website_s3_settings_update'};
export function registerR2Settings(server:McpServer,settings:R2Settings){
 const read=async()=>{const values=await settings.public();return {schema:{type:'object',properties:Object.fromEntries(r2Fields.map(name=>[name,{type:'string',title:name,readOnly:true}]))},values,layout:[{kind:'group',title:'S3配置',items:r2Fields.map(property=>({kind:'property',property}))}]};};
 server.registerTool(r2SettingsCapability.readTool,{title:'读取 S3 配置',inputSchema:{},outputSchema:{schema:z.record(z.string(),z.unknown()),values:z.record(z.string(),z.string()),layout:z.array(z.record(z.string(),z.unknown()))},annotations:{readOnlyHint:true,openWorldHint:false},_meta:{ui:{visibility:['app']}}},async()=>({content:[],structuredContent:await read()}));
 server.registerTool(r2SettingsCapability.updateTool,{title:'S3 配置只读',inputSchema:{set:z.record(z.string(),z.union([z.string(),z.number(),z.boolean()]))},outputSchema:{values:z.record(z.string(),z.string())},annotations:{readOnlyHint:true,openWorldHint:false},_meta:{ui:{visibility:['app']}}},async()=>({content:[{type:'text',text:'S3 配置不可修改，已恢复预配置值。'}],structuredContent:{values:(await read()).values}}));
}
