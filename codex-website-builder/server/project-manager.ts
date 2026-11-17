import { projectTitle, statusLabels } from './project-presentation';
import { readFile, mkdir, copyFile, realpath, stat, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, extname, join, relative, sep, isAbsolute } from 'node:path';
import { openDirectory } from './open-directory';
import { ProjectStore } from './projects';
import { compactProject } from './project-service';
import { screenshotPage } from './screenshot';
import { registerPreviewFile, registerPreviewBuffer } from './resource-proxy';
import { gunzipSync } from 'node:zlib';
import { contained } from './preview';
import { imageDimensions } from './image-dimensions';
import { assertMainRepository } from './project-layout';
import {assertEditable,operationLock} from './project-operations';
import {imagePublisher} from './image-compression';
import {SubmissionFiles,type UploadInput} from './submission-files';

const mime = (path: string) => ({'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.ico':'image/x-icon','.svg':'image/svg+xml','.gif':'image/gif','.pdf':'application/pdf','.json':'application/json'}[extname(path).toLowerCase()] || 'application/octet-stream');
export function projectManager(store: ProjectStore) {
  const publisher=imagePublisher(store);
  const uploads=new SubmissionFiles(store);
  const captures=new Map<string,{text:string;time:number}>();
  const thumbnails = new Map<string, Promise<void>>();
  const thumbnailRetry = new Map<string, number>();
  const shutdown = new AbortController();
  async function thumbnail(id: string) {
    if(shutdown.signal.aborted)return;
    if (thumbnails.has(id)) return thumbnails.get(id);
    const task = (async () => {
      const row = store.database.row(id), project = store.database.project(id);
      const home = project?.pages.find(page => /^(?:index|home)\.html?$/i.test(page.path));
      if (!home || home.status !== 'ready' || row.thumbnail_revision === String(home.version)) return;
      if((thumbnailRetry.get(id)||0)>Date.now())return;
      const thread: any = store.database.sql.prepare('SELECT thread_id FROM threads WHERE project_id=? LIMIT 1').get(id);
      if (!thread) return;
      try {
        const result = await screenshotPage(store, { thread_id: thread.thread_id, project_id: id, path: home.path, thumbnail: true, signal: shutdown.signal });
        store.database.sql.prepare('UPDATE projects SET thumbnail_path=?,thumbnail_revision=? WHERE id=? AND deleted_at IS NULL').run(result.path, String(home.version), id);
      } catch (error) { thumbnailRetry.set(id,Date.now()+60000);if(!shutdown.signal.aborted)console.error(`Website Builder thumbnail ${id}: ${(error as Error).message}`); }
    })();
    thumbnails.set(id, task);
    void task.finally(() => thumbnails.delete(id));
    return task;
  }
  async function list() {
    const projects = await store.list();
    return Promise.all(projects.map(async project => {
      // Generate lazily; listing never waits for a browser or a network resource.
      if (thumbnails.size < 2) void thumbnail(project.id);
      let image: string | undefined;
      if (project.thumbnailPath) {
        const directory = await realpath(store.metadataDirectory(project.id));
        const path = await realpath(project.thumbnailPath).catch(() => '');
        const rel = relative(directory, path);
        if (path && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)) image = `data:image/png;base64,${(await readFile(path)).toString('base64')}`;
      }
      const details=store.database.project(project.id);
      const status=store.database.status(project.id);
      return { id:project.id,name:project.name,brand:details?.brand||project.name,country:details?.country,language:details?.language,categories:details?.categories||[],displayName:projectTitle(details||{}),status,statusLabel:statusLabels[status],deploying:!!operationLock(store.database,project.id),deletable:!operationLock(store.database,project.id)&&!['generating','modifying'].includes(status),updatedAt:project.updatedAt,thumbnail:image };
    }));
  }
  async function context(thread?: string, panelId?: string) {
    const panel = store.database.context(thread, panelId);
    const id = panel?.project_id;
    const view=id?await store.get(thread,id).catch(()=>null):null;
    if (view) {
      const rows=store.database.sql.prepare("SELECT key,value FROM settings WHERE key LIKE 'submission:%'").all() as {key:string;value:string}[];
      const submission=rows.flatMap(row=>{try{const value=JSON.parse(row.value);return value.state==='created'&&value.project_id===view.project.id&&value.thread_id===thread?[{panel_id:row.key.slice('submission:'.length),request_id:value.request_id,state:'created',files:value.files||[]}]:[];}catch{return[];}})[0];
      return { page: 'project', panel_id: panel.panel_id, ...compactProject(view),thread_id:thread||null,...(submission?{submission}:{}) };
    }
    return { page: 'home', panel_id: panel?.panel_id || panelId || null, projects: await store.list() };
  }
  async function materialResources(view:NonNullable<Awaited<ReturnType<ProjectStore['get']>>>) {
    const id=view.project.id,found:{id:string;name:string;path:string;mime:string;size:number}[]=[];
    // The live material tree owns the gallery; old database rows and deployment
    // copies must never introduce additional pictures or duplicate originals.
    const scan = async (directory: string) => {
      for (const entry of await readdir(directory, { withFileTypes: true }).catch(error=>{if(error.code==='ENOENT')return [];throw error;})) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const path = join(directory, entry.name);
        if (entry.isDirectory()) await scan(path);
        else if (entry.isFile() && !/\.(?:html?|js|mjs|css)$/i.test(path)) {
          const info = await stat(path).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
          if(!info)continue;
          const resource={id:createHash('sha256').update(id+path).digest('hex'),name:entry.name,path,mime:mime(path),size:info.size};
          found.push(resource);
          store.database.sql.prepare('INSERT INTO resources VALUES (?,?,?,?,?,?,?) ON CONFLICT(project_id,path) DO UPDATE SET size=excluded.size,mime=excluded.mime')
            .run(resource.id, id, null, entry.name, path, resource.mime, info.size);
        }
      }
    };
    await scan(view.materialDirectory);
    return found.sort((a,b)=>a.name.localeCompare(b.name,'en',{numeric:true}));
  }
  async function resources(id: string) {
    const view = await store.get(undefined, id);
    if (!view) throw Error('项目不存在');
    const material=await materialResources(view);
    const rows=store.database.sql.prepare('SELECT id,name,path,mime,size,thread_id FROM resources WHERE project_id=? ORDER BY name').all(id) as {path:string}[];
    const files=[];
    const directory=join(view.projectDirectory,'files');
    const base=await realpath(directory).catch(()=>null),root=await realpath(view.projectDirectory);
    if(base&&relative(root,base)!=='files')throw Error('项目 files 目录不能指向外部');
    if(base)for(const entry of await readdir(base,{withFileTypes:true})){
      if(!entry.isFile())continue;
      const path=join(base,entry.name),info=await stat(path);
      const row=rows.find(row=>row.path===path) as any;
      files.push({id:row?.id||createHash('sha256').update(id+path).digest('hex'),name:entry.name,path,mime:row?.mime||mime(path),size:info.size,thread_id:row?.thread_id||null});
    }
    return [...material,...files,...rows.filter(row=>{const rel=relative(join(view.metadataDirectory,'session-assets'),row.path);return rel!=='..'&&!rel.startsWith(`..${sep}`)&&!isAbsolute(rel);})];
  }
  async function run(input: UploadInput & {file_count?:number;visible_panel_id?:string;requirement?:string;request_id?:string;submission_start?:boolean;detail_ready?:boolean;cancel?:boolean;action?: string; panel_id?: string; thread_id?: string; project_id?: string; country?:string;language?:string;categories?:string[];brand?:string;name?: string; source_path?: string; path?:string;width?:number;capture_id?:string}) {
    const action = input.action || 'list';
    const panel=input.panel_id?store.database.panelById(input.panel_id):undefined;
    const thread = input.thread_id || process.env.CODEX_THREAD_ID || process.env.CODEX_SESSION_ID || panel?.thread_id || undefined;
    if (action === 'list') return { projects: await list(), thread_id: panel?.thread_id || thread || null };
    // Global navigation has a panel identity before it has a chat identity.
    // Never substitute an anonymous/fake thread or another project's last chat.
    if (action === 'context') {
      const value=await context(thread,input.panel_id);
      if(!input.requirement?.trim())return value;
      const fingerprint=createHash('sha256').update(input.requirement.trim().replace(/\s+/g,' ')).digest('hex');
      const rows=store.database.sql.prepare("SELECT key,value FROM settings WHERE key LIKE 'submission:%'").all() as {key:string;value:string}[];
      const matches=rows.flatMap(row=>{try{const record=JSON.parse(row.value);return record.state==='pending'&&record.requirement_hash===fingerprint&&Date.now()-Date.parse(record.created_at)<10*60*1000?[{panel_id:row.key.slice('submission:'.length),request_id:record.request_id,action:'create'}]:[];}catch{return[];}});
      if(matches.length===1)return {...value,submission:matches[0]};
      return matches.length>1?{...value,submission_ambiguous:true}:value;
    }
    if (!input.panel_id || !/^[a-zA-Z0-9_-]{8,128}$/.test(input.panel_id)) throw Error('需要当前面板 ID');
    // A matching pending submission authorizes its new chat to claim this
    // panel. Its originating UI can continue polling that same request after
    // the handoff; unrelated requests still obey the panel/thread boundary.
    const handoffRow=input.request_id?store.database.sql.prepare('SELECT value FROM settings WHERE key=?').get('submission:'+input.panel_id) as {value:string}|undefined:undefined;
    const handoff=handoffRow?JSON.parse(handoffRow.value):null;
    const submissionHandoff=!!input.request_id && handoff?.request_id===input.request_id && (
      action==='create' && handoff.state==='pending' ||
      action==='submission' && !input.submission_start
    );
    if(panel?.thread_id && thread && panel.thread_id!==thread && !submissionHandoff)throw Error('面板不属于当前会话');
    if(action==='resume') {
      if(!thread&&panel)return context(thread,input.panel_id);
      const binding=thread?store.database.binding(thread):null;
      const project=binding&&await store.get(thread,binding.projectId).catch(()=>null);
      store.database.panel(input.panel_id,thread||'',project?binding!.projectId:null);
      return context(thread,input.panel_id);
    }
    const submissionKey='submission:'+input.panel_id;
    const readSubmission=()=>{const row=store.database.sql.prepare('SELECT value FROM settings WHERE key=?').get(submissionKey) as {value:string}|undefined;return row?JSON.parse(row.value):null;};
    const saveSubmission=(value:unknown)=>store.database.sql.prepare('INSERT INTO settings VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(submissionKey,JSON.stringify(value));
    if(action==='upload'){
      const record=readSubmission();
      if(!input.request_id||record?.request_id!==input.request_id||record.state!=='pending')throw Error('附件所属提交已取消或失效');
      if(!record.file_count)throw Error('当前提交没有声明附件');
      const result=await uploads.upload(input.panel_id,input.request_id,input);
      if(uploads.rows(input.panel_id,input.request_id).length>record.file_count)throw Error('附件数量超出本次提交声明');
      return result;
    }
    if(action==='submission'){
      if(!input.request_id||!/^[-a-zA-Z0-9_]{8,128}$/.test(input.request_id))throw Error('提交标记无效');
      const record=readSubmission();
      if(input.cancel){if(record?.request_id===input.request_id)saveSubmission({...record,state:'cancelled'});return{state:'cancelled'};}
      if(input.submission_start){
        if(record?.request_id===input.request_id)return record;
        const count=input.file_count??0;if(!Number.isInteger(count)||count<0||count>10)throw Error('附件数量无效');
        saveSubmission({request_id:input.request_id,state:'pending',file_count:count,created_at:new Date().toISOString(),...(input.requirement?.trim()?{requirement_hash:createHash('sha256').update(input.requirement.trim().replace(/\s+/g,' ')).digest('hex')}:{})});return{state:'pending'};
      }
      if(record?.request_id!==input.request_id)throw Error('此提交已失效，请检查当前对话');
      if(input.detail_ready){
        if(record.state!=='created'||panel?.project_id!==record.project_id)throw Error('项目详情尚未绑定');
        if(input.visible_panel_id&&input.visible_panel_id!==input.panel_id){
          const visible=store.database.panelById(input.visible_panel_id);
          if(visible?.project_id!==record.project_id||visible.thread_id!==record.thread_id)throw Error('新对话详情面板尚未绑定到本次项目');
          record.chat_detail_ready=true;record.chat_panel_id=input.visible_panel_id;
        }
        record.detail_ready=true;saveSubmission(record);
      }
      if(record.state==='created'){const view=await store.get(undefined,record.project_id);if(!view)throw Error('已创建的项目不可用');return{...record,project:{page:'project',panel_id:input.panel_id,...compactProject(view),thread_id:record.thread_id}};}
      return record;
    }
    const id = input.project_id;
    if (action === 'home') { store.database.panel(input.panel_id, thread||'', null); return context(thread, input.panel_id); }
    if (action === 'create' || action === 'open' || action === 'bind') {
      if (action !== 'create' && !id) throw Error('需要项目 ID');
      if(input.request_id){const record=readSubmission();if(record?.request_id!==input.request_id||record.state==='cancelled')throw Error('创建请求已取消或失效');if(record.state==='created'){const existing=await store.get(undefined,record.project_id);if(!existing)throw Error('项目不可用');return{page:'project',...compactProject(existing),thread_id:record.thread_id,files:record.files||[]};}if(record.state==='creating')throw Error('项目正在创建，请稍后查询结果');if(record.state!=='pending')throw Error('创建请求已失效');const attached=uploads.rows(input.panel_id,input.request_id);if(attached.length!==(record.file_count||0)||attached.some(file=>file.status!=='ready'))throw Error('附件尚未完整上传，不能创建项目');saveSubmission({...record,state:'creating'});}
      try {
      const view = thread ? await store.open({ threadId: thread, projectId: id, newProject: action === 'create', name: input.name,country:input.country,language:input.language,categories:input.categories,brand:input.brand,...(action==='create'?{pages:[]}:{}) })
        : action === 'create' ? await store.createProject({name:input.name,country:input.country,language:input.language,categories:input.categories,brand:input.brand,pages:[]}) : await store.get(undefined,id);
      if(!view)throw Error('项目不存在或已删除');
      store.database.panel(input.panel_id, thread||'', view.project.id, action==='create' && submissionHandoff);
      const attachedFiles=input.request_id?await store.exclusive(view.project.id,()=>uploads.import(input.panel_id!,input.request_id!,view)):[];
      if(input.request_id)saveSubmission({request_id:input.request_id,state:'created',project_id:view.project.id,thread_id:thread||null,files:attachedFiles});
      return { page: 'project', panel_id: input.panel_id, ...compactProject(view),thread_id:thread||null,files:attachedFiles,...(input.request_id?{ui_reused:true,request_id:input.request_id,next_action:'必须调用open_thread_canvas(thread_id=本次新对话真实ID)一次，在新对话打开侧边UI并进入本项目；查询website_projects(action=submission,panel_id,request_id)等待chat_detail_ready=true再生成。附件已存入files_directory，先用website_projects(resources)获取本地绝对路径，商品JSON交给website_products(file_path)，不读取attachment://引用。不重建项目，不反复打开面板。'}:{}) };
      }catch(error){if(input.request_id)saveSubmission({request_id:input.request_id,state:'failed',error:(error as Error).message});throw error;}
    }
    if (!id) throw Error('需要项目 ID');
    if(action==='restore') {
      if(!store.database.row(id))throw Error('项目不存在');
      store.database.sql.prepare('UPDATE projects SET deleted_at=NULL WHERE id=?').run(id);
      return {projects:await list()};
    }
    const view = await store.get(thread, id);
    if (!view) throw Error('项目不存在');
    if(action==='images') {
      const images=[];
      const tasks=(store.database.sql.prepare('SELECT * FROM image_tasks WHERE project_id=? ORDER BY path').all(id) as any[])
        .filter(task=>typeof task.path==='string'&&!/[\\/]/.test(task.path)&&mime(task.path).startsWith('image/'));
      const pending=new Map<string,any>();
      for(const task of tasks){
        const info=await contained(view.materialDirectory,task.path).then(file=>stat(file)).catch(()=>null);
        if(task.status==='generating'&&info?.isFile()&&info.size>0&&`${info.size}:${info.mtimeMs}`!==task.baseline){void publisher.publish(view,task.path).catch(()=>{});}
        if(task.status!=='ready')pending.set(task.path,task);
      }
      for(const resource of await materialResources(view)) {
        if(!resource.mime.startsWith('image/'))continue;
        try {
          const base=await realpath(view.materialDirectory),file=await realpath(resource.path),path=relative(base,file);
          if(path==='..'||path.startsWith(`..${sep}`)||isAbsolute(path))continue;
          const relativePath=path.split(sep).join('/');if(pending.has(relativePath))continue;
          images.push({...resource,path:relativePath,status:'ready',...await imageDimensions(file),url:await registerPreviewFile(file,resource.mime)});
        }catch{/* Removed assets disappear from the next refresh. */}
      }
      for(const task of pending.values())images.push({id:createHash('sha256').update(id+task.path).digest('hex'),path:task.path,name:task.name,mime:mime(task.path),status:task.status,error:task.error,width:task.width,height:task.height});
      return {images};
    }
    if(action==='capture') {
      if(!input.capture_id||!/^[a-zA-Z0-9_-]{8,128}$/.test(input.capture_id)||!input.path)throw Error('截图请求无效');
      for(const [key,item]of captures)if(Date.now()-item.time>120000)captures.delete(key);
      const key=`${input.panel_id}:${id}:${input.capture_id}`;
      if(input.offset===0){if(captures.size>=8)throw Error('截图任务过多');captures.set(key,{text:'',time:Date.now()});}
      const capture=captures.get(key);
      if(!capture||input.offset!==capture.text.length||!input.chunk||input.chunk.length>512000)throw Error('截图数据分片无效');
      capture.text+=input.chunk;capture.time=Date.now();
      if(capture.text.length>32*1024*1024){captures.delete(key);throw Error('当前页面截图数据超过限制');}
      if(!input.final)return{received:capture.text.length};
      captures.delete(key);
      const snapshot=gunzipSync(Buffer.from(capture.text,'base64'),{maxOutputLength:64*1024*1024}).toString('utf8');
      if(!/<html\b/i.test(snapshot))throw Error('当前页面快照不完整');
      const image=await screenshotPage(store,{thread_id:thread,project_id:id,path:input.path,width:input.width,snapshot});
      return {resource:registerPreviewBuffer(image.bytes,'image/png'),width:image.width,fullPage:true,page:image.page};
    }
    if (action === 'delete') { assertEditable(store.database,id);store.database.remove(id); return { page: 'home', projects: await list() }; }
    if (action === 'folder') {
      await openDirectory(view.projectDirectory);
      return { directory: view.projectDirectory };
    }
    if (action === 'resources') return { resources: await resources(id) };
    if (action === 'attach') {
      if (!input.source_path || !isAbsolute(input.source_path)) throw Error('需要用户提供的资源绝对路径');
      const source = await realpath(input.source_path), info = await stat(source);
      if (!info.isFile() || info.size > 64 * 1024 * 1024) throw Error('资源必须是文件且不超过 64 MB');
      const bytes = await readFile(source), hash = createHash('sha256').update(bytes).digest('hex');
      const folder = join(view.metadataDirectory, 'session-assets'); await mkdir(folder, { recursive: true });
      const path = join(folder, hash + extname(source)); await copyFile(source, path);
      const name = source.split(/[\\/]/).pop()!;
      store.database.sql.prepare('INSERT INTO resources VALUES (?,?,?,?,?,?,?) ON CONFLICT(project_id,path) DO UPDATE SET thread_id=excluded.thread_id,name=excluded.name')
        .run(createHash('sha256').update(id + path).digest('hex'), id, thread||null, name, path, mime(path), info.size);
      return { resources: await resources(id) };
    }
    throw Error('不支持的项目管理操作');
  }
  async function imageTask(input:{thread_id:string;project_id:string;action:'begin'|'finish'|'fail';path:string;name?:string;width?:number;height?:number;error?:string}){
    const binding=store.database.binding(input.thread_id);
    if(binding?.projectId!==input.project_id)throw Error('图片任务不属于当前会话项目');
    const view=await store.get(input.thread_id,input.project_id);if(!view)throw Error('项目不存在');
    if(input.action!=='fail')assertEditable(store.database,view.project.id);
    if(input.action==='begin')await assertMainRepository(view.projectDirectory);
    const path=store.path(input.path);if(path.includes('/')||!mime(path).startsWith('image/'))throw Error('图片任务使用 material 内的图片文件名，例如 logo.png、banner1.png、about.png');
    let compression:any;
    const info=await contained(view.materialDirectory,path).then(file=>stat(file)).catch(()=>null);
    if(input.action==='begin'){assertEditable(store.database,view.project.id);publisher.reset(view.project.id,path);}
    if(input.action==='begin')store.database.sql.prepare(`INSERT INTO image_tasks(project_id,path,name,width,height,status,error,baseline) VALUES (?,?,?,?,?,'generating','',?) ON CONFLICT(project_id,path) DO UPDATE SET name=excluded.name,width=excluded.width,height=excluded.height,status='generating',error='',baseline=excluded.baseline`).run(input.project_id,path,input.name||path.split('/').pop()!,input.width||960,input.height||600,info?`${info.size}:${info.mtimeMs}`:'');
    else {
      const task=store.database.sql.prepare('SELECT baseline FROM image_tasks WHERE project_id=? AND path=?').get(input.project_id,path) as {baseline:string}|undefined;
      if(!task)throw Error('请先登记图片生成任务');
      if(input.action==='finish'&&(!info?.isFile()||!info.size||`${info.size}:${info.mtimeMs}`===task.baseline))throw Error('本次图片成品尚未写入项目');
      if(input.action==='finish'){compression=await publisher.publish(view,path);if(compression?.pending)return {project_id:input.project_id,path,material_path:join(view.materialDirectory,path),website_path:`images/${path}`,status:'generating',phase:'compressing',compression};}
      store.database.sql.prepare('UPDATE image_tasks SET status=?,error=? WHERE project_id=? AND path=?').run(input.action==='finish'?'ready':'error',input.action==='fail'?(input.error||'图片生成失败，请重试'):'',input.project_id,path);
    }
    store.database.activity(input.project_id,'image:'+path,input.action==='begin');
    return {project_id:input.project_id,path,material_path:join(view.materialDirectory,path),website_path:`images/${path}`,compression,status:input.action==='begin'?'generating':input.action==='finish'?'ready':'error'};
  }
  return { run, context, thumbnail, imageTask, close:async()=>{shutdown.abort();await Promise.allSettled([...thumbnails.values()]);} };
}
