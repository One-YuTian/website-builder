import { constants } from 'node:fs';
import { copyFile, lstat, mkdir, open, readFile, realpath, stat, unlink } from 'node:fs/promises';
import { basename, extname, isAbsolute, join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import type { ProjectStore, ProjectView } from './projects';

type Upload = {panel_id:string;request_id:string;upload_id:string;name:string;mime:string;size:number;received:number;sha256:string;status:string;project_id:string|null;path:string};
export type UploadInput = {upload_id?:string;file_name?:string;mime_type?:string;total_size?:number;sha256?:string;chunk?:string;offset?:number;final?:boolean};
const validId=(id:string)=>/^[-a-zA-Z0-9_]{8,128}$/.test(id);
const hash=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
const safeName=(name:string)=>{
  let value=name.normalize('NFC').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/[ .]+$/g,'');
  if(value.startsWith('.'))value='file_'+value;
  if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(value))value='file_'+value;
  if(!value||Buffer.byteLength(value)>240)throw Error('附件文件名为空或过长');return value;
};

export class SubmissionFiles {
  constructor(private store:ProjectStore) {
    store.database.sql.exec(`CREATE TABLE IF NOT EXISTS submission_files (
      panel_id TEXT NOT NULL,request_id TEXT NOT NULL,upload_id TEXT NOT NULL,
      name TEXT NOT NULL,mime TEXT NOT NULL,size INTEGER NOT NULL,received INTEGER NOT NULL,
      sha256 TEXT NOT NULL,status TEXT NOT NULL,project_id TEXT,path TEXT NOT NULL,
      PRIMARY KEY(panel_id,request_id,upload_id)
    )`);
  }
  rows(panel:string,request:string):Upload[] {
    return this.store.database.sql.prepare('SELECT * FROM submission_files WHERE panel_id=? AND request_id=? ORDER BY rowid').all(panel,request) as Upload[];
  }
  private directory(panel:string,request:string) {return join(this.store.stateRoot,'submissions',hash(panel+':'+request));}
  async upload(panel:string,request:string,input:UploadInput) {
    const id=input.upload_id,totalSize=input.total_size,offset=input.offset;
    if(!id||!validId(id)||!validId(panel)||!validId(request))throw Error('附件上传标记无效');
    if(!input.file_name||input.file_name.length>255||typeof totalSize!=='number'||!Number.isInteger(totalSize)||totalSize<0||totalSize>12*1024*1024)throw Error('附件名称或大小无效');
    if(!input.sha256||!/^[a-f0-9]{64}$/.test(input.sha256))throw Error('附件校验值无效');
    if(typeof input.chunk!=='string'||input.chunk.length>262144||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input.chunk))throw Error('附件分片无效');
    if(typeof offset!=='number'||!Number.isInteger(offset)||offset<0)throw Error('附件分片偏移无效');
    const directory=this.directory(panel,request);await mkdir(directory,{recursive:true});
    const state=await realpath(this.store.stateRoot),actual=await realpath(directory),rel=relative(state,actual);
    if(rel==='..'||rel.startsWith(`..${sep}`)||isAbsolute(rel))throw Error('附件暂存目录不能越界');
    const lockPath=join(directory,'upload.lock');let lock;
    for(let attempt=0;attempt<200;attempt++){try{lock=await open(lockPath,'wx');break;}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;const info=await stat(lockPath).catch(()=>null);if(info&&Date.now()-info.mtimeMs>120000)await unlink(lockPath).catch(()=>{});await new Promise(resolve=>setTimeout(resolve,25));}}
    if(!lock)throw Error('附件正在上传，请稍后重试');
    try {
      let row=this.rows(panel,request).find(item=>item.upload_id===id);
      if(!row){
        const rows=this.rows(panel,request);
        if(rows.length>=10||rows.reduce((sum,item)=>sum+item.size,0)+totalSize>12*1024*1024)throw Error('最多选择10个文件，总大小不超过12MB。');
        if(offset!==0)throw Error('附件必须从首个分片开始上传');
        const path=join(directory,id+'.part');const file=await open(path,'wx');await file.close();
        this.store.database.sql.prepare("INSERT INTO submission_files VALUES (?,?,?,?,?,?,0,?,'uploading',NULL,?)").run(panel,request,id,safeName(input.file_name),input.mime_type||'application/octet-stream',totalSize,input.sha256,path);
        row=this.rows(panel,request).find(item=>item.upload_id===id)!;
      }
      if(row.name!==safeName(input.file_name)||row.size!==totalSize||row.sha256!==input.sha256)throw Error('附件上传信息与原请求不一致');
      const bytes=Buffer.from(input.chunk,'base64');
      if(offset>row.received||offset+bytes.length>row.size)throw Error('附件分片顺序或大小无效');
      const info=await lstat(row.path);if(!info.isFile()||info.isSymbolicLink())throw Error('附件暂存路径无效');
      const file=await open(row.path,'r+');
      try{
        if(offset<row.received){
          if(offset+bytes.length>row.received)throw Error('附件重试分片范围无效');
          const saved=Buffer.alloc(bytes.length);await file.read(saved,0,saved.length,offset);if(!saved.equals(bytes))throw Error('附件重试数据不一致');
        }else{
          let written=0;while(written<bytes.length){const result=await file.write(bytes,written,bytes.length-written,offset+written);if(!result.bytesWritten)throw Error('附件写入失败');written+=result.bytesWritten;}
          row.received+=bytes.length;
          this.store.database.sql.prepare('UPDATE submission_files SET received=? WHERE panel_id=? AND request_id=? AND upload_id=?').run(row.received,panel,request,id);
        }
      }finally{await file.close();}
      if(input.final){
        if(row.received!==row.size||hash(await readFile(row.path))!==row.sha256)throw Error('附件未完整上传或校验失败');
        this.store.database.sql.prepare("UPDATE submission_files SET status='ready' WHERE panel_id=? AND request_id=? AND upload_id=?").run(panel,request,id);
      }
      return {upload_id:id,name:row.name,size:row.size,received:row.received,complete:input.final||row.status==='ready'};
    }finally{await lock.close();await unlink(lockPath).catch(()=>{});}
  }
  async import(panel:string,request:string,view:ProjectView) {
    const rows=this.rows(panel,request);
    if(rows.some(row=>row.status!=='ready'&&row.status!=='imported'))throw Error('附件尚未完整上传，不能创建项目');
    const directory=join(view.projectDirectory,'files');await mkdir(directory,{recursive:true});
    const root=await realpath(view.projectDirectory),actual=await realpath(directory),rel=relative(root,actual);
    if(rel!=='files')throw Error('项目 files 目录无效或指向项目外部');
    const imported=[];
    for(const row of rows){
      if(row.project_id&&row.project_id!==view.project.id)throw Error('附件已属于其他项目');
      const bytes=await readFile(row.path);if(bytes.length!==row.size||hash(bytes)!==row.sha256)throw Error('附件原始数据校验失败');
      let name=row.name,path=join(actual,name);
      for(let attempt=0;;attempt++){
        try{await copyFile(row.path,path,constants.COPYFILE_EXCL);break;}
        catch(error){
          if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;
          const info=await lstat(path);
          if(info.isFile()&&!info.isSymbolicLink()&&info.size===row.size&&hash(await readFile(path))===row.sha256)break;
          const ext=extname(row.name);name=basename(row.name,ext)+'-'+row.sha256.slice(0,12)+(attempt?'-'+attempt:'')+ext;path=join(actual,name);
        }
      }
      const id=hash(view.project.id+path);
      this.store.database.sql.prepare('INSERT INTO resources VALUES (?,?,?,?,?,?,?) ON CONFLICT(project_id,path) DO UPDATE SET thread_id=excluded.thread_id,mime=excluded.mime,size=excluded.size').run(id,view.project.id,view.threadId||null,name,path,row.mime,row.size);
      this.store.database.sql.prepare("UPDATE submission_files SET status='imported',project_id=? WHERE panel_id=? AND request_id=? AND upload_id=?").run(view.project.id,panel,request,row.upload_id);
      imported.push({id,name,original_name:row.name,path,mime:row.mime,size:row.size,sha256:row.sha256});
    }
    return imported;
  }
}
