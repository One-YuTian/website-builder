import {readdir,lstat,realpath} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {join,relative,isAbsolute,sep,extname} from 'node:path';
import type {ProjectStore} from './projects';
import type {R2Settings,R2Config} from './r2-settings';
import {operationLock,assertEditable} from './project-operations';
type File={path:string;file:string;size:number;sha256:string;contentType:string};
type S3={list(prefix:string,signal:AbortSignal):Promise<{key:string;size:number}[]>;put(key:string,file:any,signal:AbortSignal,progress?:(bytes:number)=>void):Promise<any>;head(key:string,signal:AbortSignal):Promise<{size:number;sha256:string}>;remove(key:string,signal:AbortSignal):Promise<void>};
const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.htm':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.gif':'image/gif','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8','.xml':'application/xml','.mp4':'video/mp4','.pdf':'application/pdf','.webmanifest':'application/manifest+json'};
export async function sourceSnapshot(root:string):Promise<File[]>{
 const canonical=await realpath(root),files:File[]=[];
 const walk=async(folder:string):Promise<void>=>{for(const entry of (await readdir(folder,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){if(entry.name==='.git'||/^\.env(?:\.|$)/.test(entry.name))throw Error('src 包含私有配置目录或文件，不能部署');const file=join(folder,entry.name),info=await lstat(file);if(info.isSymbolicLink())throw Error('src 包含符号链接，不能部署');const actual=await realpath(file),rel=relative(canonical,actual);if(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel))throw Error('src 资源路径越界');if(info.isDirectory())await walk(file);else if(info.isFile()){if(/(?:^|\/)(?:\.git|\.env(?:\..*)?)$/.test(rel.split(sep).join('/')))throw Error('src 包含私有配置文件，不能部署');const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);files.push({path:relative(root,file).split(sep).join('/'),file,size:info.size,sha256:hash.digest('hex'),contentType:mime[extname(file).toLowerCase()]||'application/octet-stream'});}}};await walk(root);return files;
}
const fingerprint=(files:File[])=>JSON.stringify(files.map(({path,size,sha256})=>({path,size,sha256})));
export class R2Deployment {
 private active=new Map<string,AbortController>();
 constructor(readonly store:ProjectStore,readonly settings:R2Settings,private factory?: (config:R2Config)=>Promise<S3>|S3){}
 private read(id:string){const row=this.store.database.sql.prepare('SELECT value FROM settings WHERE key=?').get('r2:'+id) as any;return row?JSON.parse(row.value):null;}
 private write(id:string,value:any){this.store.database.sql.prepare('INSERT INTO settings VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('r2:'+id,JSON.stringify({...value,updated_at:new Date().toISOString()}));}
 status(id:string){let job=this.read(id);const lock=operationLock(this.store.database,id);if(job&&['running','cancelling'].includes(job.status)&&!lock)job={...job,status:'failed',phase:'部署已中断',message:'部署进程或写入锁已失效，请重新部署完成同步'};return {...job,locked:!!lock,cancellable:!!lock&&!!job&&lock.owner===job.id};}
 private checkpoint(project:string,id:string,signal:AbortSignal){signal.throwIfAborted();assertEditable(this.store.database,project,id);const row=this.store.database.sql.prepare('SELECT used FROM deployment_requests WHERE id=?').get(id) as any;if(row?.used===2)throw Error('R2_DEPLOY_CANCELLED');}
 cancel(project:string,actor:string){const job=this.read(project),lock=operationLock(this.store.database,project);if(!job||!lock)return {status:'cancelled'};if(job.actor!==actor||job.id!==lock.owner)throw Error('不能取消其他会话的部署');this.store.database.sql.prepare('UPDATE deployment_requests SET used=2 WHERE id=?').run(job.id);this.active.get(job.id)?.abort();this.write(project,{...job,status:'cancelling',phase:'正在取消，等待上传收尾'});return this.status(project);}
 async start(project:string,actor:string){
  if(!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(project))throw Error('项目ID不能作为部署子域名');
  const id=randomUUID();
  await this.store.exclusive(project,async()=>{if(this.store.database.status(project)!=='completed')throw Error('项目尚未完成，暂不能部署，请先完成或修复当前任务');if(this.store.database.sql.prepare("SELECT path FROM image_tasks WHERE project_id=? AND status='generating' LIMIT 1").get(project)||this.store.database.sql.prepare("SELECT path FROM image_compressions WHERE project_id=? AND status='running' AND lease_until>? LIMIT 1").get(project,Date.now()))throw Error('图片仍在生成或压缩，暂不能部署');const changed=this.store.database.sql.prepare("INSERT INTO deployment_locks VALUES (?,?,?,'R2准备部署') ON CONFLICT(project_id) DO UPDATE SET owner=excluded.owner,expires_at=excluded.expires_at,stage=excluded.stage WHERE deployment_locks.expires_at<=?").run(project,id,Date.now()+120000,Date.now());if(!changed.changes)throw Error('项目正在部署，请等待完成或取消');this.store.database.sql.prepare('INSERT INTO deployment_requests(id,project_id,thread_id,data,expires_at,used) VALUES (?,?,?,?,?,1)').run(id,project,actor,JSON.stringify({type:'r2'}),Date.now()+86400000);this.write(project,{id,actor,status:'running',phase:'检查静态资源',completed:0,total:0,uploaded_bytes:0,total_bytes:0,deleted:0});});
  void this.run(project,id).catch(()=>{});return this.status(project);
 }
 private async run(project:string,id:string){
  const controller=new AbortController();this.active.set(id,controller);let job=this.read(project),lastBeat=0;
  const checkpoint=()=>this.checkpoint(project,id,controller.signal);
  const update=(values:Record<string,unknown>)=>{checkpoint();job={...job,...values};this.write(project,job);this.store.database.sql.prepare('UPDATE deployment_locks SET stage=? WHERE owner=?').run(String(job.phase),id);};
  const timer=setInterval(()=>{const row=this.store.database.sql.prepare('SELECT used FROM deployment_requests WHERE id=?').get(id) as any;if(row?.used===2)controller.abort();if(Date.now()-lastBeat>10000){lastBeat=Date.now();this.store.database.sql.prepare('UPDATE deployment_locks SET expires_at=? WHERE owner=?').run(Date.now()+120000,id);}},250);
  let config:R2Config|undefined;
  try{
   config=await this.settings.get();for(const name of ['R2_ACCOUNT_ID','R2_BUCKET_NAME','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_DEPLOY_HOST'] as const)if(!config[name])throw Error('R2 预配置缺少 '+name+'，请联系管理员');
   if(!/^[a-f\d]{32}$/i.test(config.R2_ACCOUNT_ID)||!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(config.R2_BUCKET_NAME)||!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(config.R2_DEPLOY_HOST))throw Error('R2 预配置地址无效');
   const view=await this.store.get(undefined,project);if(!view)throw Error('项目不存在');
   if(!view.project.pages.length||view.project.pages.some(page=>page.status!=='ready'))throw Error('项目页面尚未全部生成完成');
   const files=await sourceSnapshot(view.directory);if(!files.some(file=>file.path==='index.html'))throw Error('src/index.html 缺失，不能部署');
   const s3:S3=this.factory?await this.factory(config):(await import(new URL('../runtime/r2/s3.mjs',import.meta.url).href)).createS3Client(config);
   const prefix=project+'/',wanted=new Set(files.map(file=>prefix+file.path)),signature=fingerprint(files);
   update({total:files.length,total_bytes:files.reduce((sum,file)=>sum+file.size,0),phase:'读取云端文件列表'});
   const remote=await s3.list(prefix,controller.signal);checkpoint();if(remote.some(file=>!file.key.startsWith(prefix)))throw Error('云端对象越出当前项目目录');
   let bytes=0;
   for(const file of files){checkpoint();update({phase:'上传 '+file.path,current_file:file.path});let progressTime=0;await s3.put(prefix+file.path,{...file,body:createReadStream(file.file)},controller.signal,sent=>{if(Date.now()-progressTime>400){progressTime=Date.now();update({uploaded_bytes:bytes+Math.min(sent,file.size)});}});checkpoint();const head=await s3.head(prefix+file.path,controller.signal);if(head.size!==file.size||head.sha256!==file.sha256)throw Error('云端文件校验失败：'+file.path);bytes+=file.size;update({completed:job.completed+1,uploaded_bytes:bytes});}
   if(fingerprint(await sourceSnapshot(view.directory))!==signature)throw Error('部署期间本地源码发生变化，未确认部署完成');
   for(const extra of remote.filter(file=>!wanted.has(file.key))){checkpoint();update({phase:'清理失效文件 '+extra.key.slice(prefix.length)});await s3.remove(extra.key,controller.signal);update({deleted:job.deleted+1});}
   update({phase:'核对云端与本地一致性'});const final=await s3.list(prefix,controller.signal);if(final.length!==files.length||new Set(final.map(file=>file.key)).size!==wanted.size||final.some(file=>!wanted.has(file.key)))throw Error('云端文件列表与本地不一致');
   for(const file of files){checkpoint();const head=await s3.head(prefix+file.path,controller.signal);if(head.size!==file.size||head.sha256!==file.sha256)throw Error('云端最终内容校验失败：'+file.path);}
   if(fingerprint(await sourceSnapshot(view.directory))!==signature)throw Error('本地源码在最终核验期间变化');
   update({status:'completed',phase:'部署完成',current_file:'',url:`https://${project}.${config.R2_DEPLOY_HOST}`,message:'src 与云端项目目录已同步并核对一致'});
  }catch(error){const cancelled=controller.signal.aborted||(error as Error).message==='R2_DEPLOY_CANCELLED';controller.abort();let message=(error as Error).message;for(const value of [config?.R2_ACCESS_KEY_ID,config?.R2_SECRET_ACCESS_KEY])if(value)message=message.replaceAll(value,'[REDACTED]');this.write(project,{...job,status:cancelled?'cancelled':'failed',phase:cancelled?'部署已取消':'部署失败',message:cancelled?'已停止后续操作，已上传内容保留；重新部署会再次完整同步':message});}
  finally{clearInterval(timer);this.active.delete(id);this.store.database.sql.prepare('DELETE FROM deployment_locks WHERE project_id=? AND owner=?').run(project,id);this.store.database.sql.prepare('UPDATE deployment_requests SET used=3 WHERE id=? AND used<>2').run(id);}
 }
}
