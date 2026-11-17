import {readFile,lstat,mkdir,open,rename,unlink} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import type {ProjectStore,ProjectView} from './projects';
import {contained} from './preview';
import {assertEditable} from './project-operations';
import {assertMainRepository} from './project-layout';
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
type Result={binary:Buffer;size:number;originalSize:number;unchanged:boolean;attempts:number};
type Compressor=(input:Buffer,name:string,options:any)=>Promise<Result>;
export function imagePublisher(store:ProjectStore,compressor?:Compressor){
 const active=new Map<string,Promise<any>>();
 const row=(id:string,path:string)=>store.database.sql.prepare('SELECT * FROM image_compressions WHERE project_id=? AND path=?').get(id,path) as any;
 const stop=(id:string,path:string,error:string)=>{store.database.sql.prepare("UPDATE image_tasks SET status='error',error=? WHERE project_id=? AND path=?").run(error,id,path);store.database.activity(id,'image:'+path,false);};
 async function work(view:ProjectView,path:string){
  const id=view.project.id,owner=randomUUID();let claimed=false,timer:ReturnType<typeof setInterval>|undefined;
  try{
   const initial=await store.exclusive(id,async()=>{
    assertEditable(store.database,id);await assertMainRepository(view.projectDirectory);
    const source=await contained(view.materialDirectory,path),info=await lstat(source);if(!info.isFile())throw Error('原图不是普通文件');
    const input=await readFile(source),sourceHash=hash(input),previous=row(id,path);
    await mkdir(join(view.directory,'images'),{recursive:true});const images=await contained(view.directory,'images'),target=join(images,path);
    const targetHash=await contained(images,path).then(file=>readFile(file)).then(hash).catch(error=>{if(error.code==='ENOENT')return '';throw error;});
    if(previous?.status==='done'&&previous.source_hash===sourceHash&&previous.output_hash===targetHash){store.database.sql.prepare("UPDATE image_tasks SET status='ready',error='' WHERE project_id=? AND path=?").run(id,path);store.database.activity(id,'image:'+path,false);return {cached:JSON.parse(previous.report)};}
    if(previous?.status==='running'&&previous.lease_until>Date.now())return {pending:true};
    if(previous?.status==='failed'||previous?.attempts>=3)throw Error(previous.error||'图片压缩已达到3次上限，请登记新的begin任务后重试');
    if(previous&&previous.source_hash!==sourceHash)throw Error('原图已变化，请重新begin图片任务');
    store.database.sql.prepare("INSERT INTO image_compressions(project_id,path,source_hash,status,attempts,owner,lease_until) VALUES (?,?,?,'running',?,?,?) ON CONFLICT(project_id,path) DO UPDATE SET status='running',owner=excluded.owner,lease_until=excluded.lease_until").run(id,path,sourceHash,previous?.attempts||0,owner,Date.now()+180000);claimed=true;store.database.sql.prepare("UPDATE image_tasks SET status='generating',error='' WHERE project_id=? AND path=?").run(id,path);store.database.activity(id,'image:'+path);
    return {source,input,sourceHash,target,targetHash,attempts:previous?.attempts||0};
   });
   if('cached' in initial)return initial.cached;if('pending' in initial)return {pending:true};
   timer=setInterval(()=>{store.database.sql.prepare('UPDATE image_compressions SET lease_until=? WHERE project_id=? AND path=? AND owner=?').run(Date.now()+180000,id,path,owner);},10000);
   const pluginRoot=fileURLToPath(new URL('../../',import.meta.url));
   const skill=(process.env.WEBSITE_BUILDER_SKILL_ROOT||join(pluginRoot,'skills/website-builder')).replaceAll('${PLUGIN_ROOT}',pluginRoot);
   const compress=compressor||(await import(pathToFileURL(resolve(skill,'../website-image-generator/scripts/compress-image.mjs')).href)).compressImageWithRetry as Compressor;
   const result=await compress(initial.input,path,{attemptsUsed:initial.attempts,onAttempt:(attempt:number)=>{
    const current=row(id,path);if(current?.owner!==owner||current.status!=='running'||(store.database.sql.prepare('SELECT status FROM image_tasks WHERE project_id=? AND path=?').get(id,path) as any)?.status!=='generating')throw Error('图片压缩任务已变化或停止');
    store.database.sql.prepare('UPDATE image_compressions SET attempts=? WHERE project_id=? AND path=? AND owner=?').run(attempt,id,path,owner);
   }});
   const report={attempts:result.attempts,original_size:result.originalSize,compressed_size:result.size,saved_bytes:result.originalSize-result.size,unchanged:result.unchanged};
   await store.exclusive(id,async()=>{
    assertEditable(store.database,id);await assertMainRepository(view.projectDirectory);if(row(id,path)?.owner!==owner||(store.database.sql.prepare('SELECT status FROM image_tasks WHERE project_id=? AND path=?').get(id,path) as any)?.status!=='generating')throw Error('图片任务已变化或停止');
    if(hash(await readFile(await contained(view.materialDirectory,path)))!==initial.sourceHash)throw Error('原图在压缩期间被修改，未发布');
    const images=await contained(view.directory,'images');const currentHash=await contained(images,path).then(file=>readFile(file)).then(hash).catch(error=>{if(error.code==='ENOENT')return '';throw error;});if(currentHash!==initial.targetHash)throw Error('网站图片在压缩期间被修改，未覆盖');
    const temporary=join(images,'.'+path+'.'+owner+'.tmp');
    try{const handle=await open(temporary,'wx');try{await handle.writeFile(result.binary);await handle.sync();}finally{await handle.close();}if(hash(await readFile(await contained(view.materialDirectory,path)))!==initial.sourceHash)throw Error('原图在写入期间变化，未发布');const finalTargetHash=await contained(images,path).then(file=>readFile(file)).then(hash).catch(error=>{if(error.code==='ENOENT')return '';throw error;});if(finalTargetHash!==initial.targetHash)throw Error('网站图片在写入期间变化，未覆盖');await rename(temporary,initial.target);}finally{await unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error;});}
    store.database.sql.prepare("UPDATE image_compressions SET status='done',lease_until=0,output_hash=?,report=?,error='' WHERE project_id=? AND path=? AND owner=?").run(hash(result.binary),JSON.stringify(report),id,path,owner);
    store.database.sql.prepare("UPDATE image_tasks SET status='ready',error='' WHERE project_id=? AND path=?").run(id,path);store.database.activity(id,'image:'+path,false);
   });
   return report;
  }catch(error){const message=(error as Error).message;if(claimed)store.database.sql.prepare("UPDATE image_compressions SET status='failed',lease_until=0,error=? WHERE project_id=? AND path=? AND owner=?").run(message,id,path,owner);stop(id,path,message);throw error;}
  finally{if(timer)clearInterval(timer);}
 }
 return {
  publish(view:ProjectView,path:string){const key=view.project.id+':'+path;if(active.has(key))return active.get(key)!;const promise=work(view,path);active.set(key,promise);void promise.finally(()=>active.delete(key)).catch(()=>{});return promise;},
  reset(id:string,path:string){const current=row(id,path);if(current?.status==='running'&&current.lease_until>Date.now())throw Error('图片正在压缩，请等待当前任务结束');store.database.sql.prepare('DELETE FROM image_compressions WHERE project_id=? AND path=?').run(id,path);},
 };
}
