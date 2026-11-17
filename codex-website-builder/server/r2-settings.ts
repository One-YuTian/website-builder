import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createDecipheriv} from 'node:crypto';
import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
export const r2Fields=['R2_ACCOUNT_ID','R2_BUCKET_NAME','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_DEPLOY_HOST'] as const;
export type R2Config=Record<typeof r2Fields[number],string>;
const mask='••••••••';
export class R2Settings {
 constructor(readonly root:string,private env=process.env){}
 async get():Promise<R2Config>{
  let data:any={};try{data=JSON.parse(await readFile(join(this.root,'config/r2-config.json'),'utf8'));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw Error('R2 本机配置不可读取');}
  if(data.credentials){try{const key=await readFile(join(this.root,'config/r2-key.bin')),cipher=createDecipheriv('aes-256-gcm',key,Buffer.from(data.credentials.iv,'hex'));cipher.setAuthTag(Buffer.from(data.credentials.tag,'hex'));Object.assign(data,JSON.parse(Buffer.concat([cipher.update(Buffer.from(data.credentials.value,'hex')),cipher.final()]).toString()));}catch{throw Error('R2 本机凭据不可读取，请联系配置管理员');}}
  return Object.fromEntries(r2Fields.map(name=>[name,String(data[name]??this.env[name]??'')])) as R2Config;
 }
 async public(){const data=await this.get();return {...data,R2_ACCESS_KEY_ID:data.R2_ACCESS_KEY_ID?mask:'未配置',R2_SECRET_ACCESS_KEY:data.R2_SECRET_ACCESS_KEY?mask:'未配置'};}
}
export const r2SettingsCapability={readTool:'website_s3_settings_read',updateTool:'website_s3_settings_update'};
export function registerR2Settings(server:McpServer,settings:R2Settings){
 const read=async()=>{const values=await settings.public();return {schema:{type:'object',properties:Object.fromEntries(r2Fields.map(name=>[name,{type:'string',title:name,readOnly:true}]))},values,layout:[{kind:'group',title:'S3配置',items:r2Fields.map(property=>({kind:'property',property}))}]};};
 server.registerTool(r2SettingsCapability.readTool,{title:'读取 S3 配置',inputSchema:{},outputSchema:{schema:z.record(z.string(),z.unknown()),values:z.record(z.string(),z.string()),layout:z.array(z.record(z.string(),z.unknown()))},annotations:{readOnlyHint:true,openWorldHint:false},_meta:{ui:{visibility:['app']}}},async()=>({content:[],structuredContent:await read()}));
 server.registerTool(r2SettingsCapability.updateTool,{title:'S3 配置只读',inputSchema:{set:z.record(z.string(),z.union([z.string(),z.number(),z.boolean()]))},outputSchema:{values:z.record(z.string(),z.string())},annotations:{readOnlyHint:true,openWorldHint:false},_meta:{ui:{visibility:['app']}}},async()=>({content:[{type:'text',text:'S3 配置不可修改，已恢复预配置值。'}],structuredContent:{values:(await read()).values}}));
}
