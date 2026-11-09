import { mkdir, readFile, rename, writeFile, open, unlink, realpath, stat, readdir } from 'node:fs/promises';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { assemblePage } from './assemble';

export type PageState = 'queued'|'generating'|'ready'|'error';
export interface ProjectPage { path: string; title: string; status: PageState; version: number; error?: string }
export interface WebsiteProject { id: string; name: string; brief: string; language: string; revision: string; pages: ProjectPage[]; updatedAt: string }
export interface ProjectView { project: WebsiteProject; threadId: string; directory: string; revision: string }
export const DEFAULT_PAGES = ['index','shop','product','cart','wishlist','checkout','login','register','about','contact','terms','privacy','return'].map(name=>({path:`${name}.html`,title:name}));
const idPattern = /^[a-f0-9]{4}(?:-[a-f0-9]{4}){3}$/;
const pause = (ms: number) => new Promise(resolve=>setTimeout(resolve,ms));
async function json<T>(file: string): Promise<T | null> { try { return JSON.parse(await readFile(file,'utf8')); } catch(error) { if((error as NodeJS.ErrnoException).code==='ENOENT')return null;throw error; } }
async function atomic(file: string, value: string) {
  await mkdir(dirname(file),{recursive:true});const temp=`${file}.${randomUUID()}.tmp`;
  try{
    await writeFile(temp,value,'utf8');
    // Windows readers/antivirus may briefly hold the destination. Keep atomic replacement,
    // retry sharing violations instead of deleting the existing manifest or truncating it.
    for(let attempt=0;;attempt++){try{await rename(temp,file);break;}catch(error){if(attempt>=25||!['EPERM','EACCES','EBUSY'].includes((error as NodeJS.ErrnoException).code||''))throw error;await pause(Math.min(20*(attempt+1),120));}}
  }finally{await unlink(temp).catch(()=>{});}
}

export class ProjectStore {
  readonly stateRoot: string;
  constructor(readonly root: string) { this.root=resolve(root);this.stateRoot=join(dirname(this.root),'.builder-state'); }
  private binding(thread: string) { if(!thread.trim())throw new Error('需要当前真实 thread_id，不能使用共享匿名会话');return join(this.stateRoot,'threads',createHash('sha256').update(thread).digest('hex')+'.json'); }
  private folder(id: string) { if(!idPattern.test(id))throw new Error('项目 ID 无效');return join(this.root,id); }
  private manifest(id: string) { return join(this.folder(id),'.website-builder.json'); }
  private async lock<T>(key: string, run: ()=>Promise<T>): Promise<T> {
    await mkdir(join(this.stateRoot,'locks'),{recursive:true});const file=join(this.stateRoot,'locks',createHash('sha256').update(key).digest('hex')+'.lock');
    let handle: Awaited<ReturnType<typeof open>> | undefined;
    for(let attempt=0;attempt<100;attempt++) { try {handle=await open(file,'wx');break;}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;const info=await stat(file).catch(()=>null);if(info&&Date.now()-info.mtimeMs>120000)await unlink(file).catch(()=>{});await pause(50);} }
    if(!handle)throw new Error('项目正在写入，请稍后重试');
    try{return await run();}finally{await handle.close();await unlink(file).catch(()=>{});}
  }
  private async save(project: WebsiteProject) {project.revision=randomUUID();project.updatedAt=new Date().toISOString();await atomic(this.manifest(project.id),JSON.stringify(project,null,2));}
  async get(threadId?: string, projectId?: string): Promise<ProjectView | null> {
    const binding = threadId ? await json<{projectId:string;threadId:string}>(this.binding(threadId)) : await json<{projectId:string;threadId:string}>(join(this.stateRoot,'active.json'));
    const id=projectId || binding?.projectId;if(!id)return null;
    const project=await json<WebsiteProject>(this.manifest(id));if(!project)throw new Error('项目不存在');
    const base=await realpath(this.root),folder=await realpath(this.folder(id)),rel=relative(base,folder);if(rel==='..'||rel.startsWith(`..${sep}`)||isAbsolute(rel))throw new Error('项目目录不能指向外部');
    const currentThread=threadId || binding?.threadId || '';
    return {project,threadId:currentThread,directory:this.folder(id),revision:`${id}:${currentThread}:${project.revision}`};
  }
  async list() {await mkdir(this.root,{recursive:true});const projects=[];for(const entry of await readdir(this.root,{withFileTypes:true})){if(!entry.isDirectory()||!idPattern.test(entry.name))continue;const project=await json<WebsiteProject>(this.manifest(entry.name));if(project)projects.push({id:project.id,name:project.name,updatedAt:project.updatedAt});}return projects.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
  async open(input: {threadId:string;projectId?:string;newProject?:boolean;name?:string;brief?:string;language?:string;pages?:{path:string;title:string}[]}) {
    return this.lock(`thread:${input.threadId}`,async()=>{
      let view = input.newProject ? null : await this.get(input.threadId,input.projectId);
      if(!view) {
        if(input.projectId)throw new Error('指定项目不存在，不会用相同名字创建替代项目');
        const id=randomBytes(8).toString('hex').match(/.{4}/g)!.join('-');
        const pages=(input.pages || DEFAULT_PAGES).map(page=>({...page,path:this.path(page.path,true),status:'queued' as const,version:0}));
        if(new Set(pages.map(page=>page.path)).size!==pages.length)throw new Error('页面路径重复');
        const project:WebsiteProject={id,name:input.name||'Ecommerce website',brief:input.brief||'',language:input.language||'en',revision:'',pages,updatedAt:''};
        await mkdir(this.folder(id),{recursive:true});await this.save(project);
        view={project,threadId:input.threadId,directory:this.folder(id),revision:`${id}:${input.threadId}:${project.revision}`};
      }
      const binding={threadId:input.threadId,projectId:view.project.id};
      await atomic(this.binding(input.threadId),JSON.stringify(binding));await atomic(join(this.stateRoot,'active.json'),JSON.stringify(binding));
      return view;
    });
  }
  path(value: string, htmlOnly=false) {
    if(isAbsolute(value)||value.includes('\\')||value.includes('\0')||value.split('/').some(part=>!part||part==='.'||part==='..'||part.startsWith('.'))||/[:<>"|?*]/.test(value))throw new Error('只允许项目内的相对文件路径');
    if(htmlOnly&&!/\.html?$/i.test(value))throw new Error('页面必须是 HTML 文件');return value;
  }
  private async target(id: string, value: string) {
    const path=this.path(value), root=await realpath(this.folder(id));let folder=root;
    for(const part of path.split('/').slice(0,-1)){folder=join(folder,part);await mkdir(folder,{recursive:true});const actual=await realpath(folder);const rel=relative(root,actual);if(rel==='..'||rel.startsWith(`..${sep}`)||isAbsolute(rel))throw new Error('项目路径不能经过外部符号链接');}
    const file=join(root,path);try{const actual=await realpath(file);const rel=relative(root,actual);if(rel==='..'||rel.startsWith(`..${sep}`)||isAbsolute(rel))throw new Error('文件不能指向项目外部');}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
    return file;
  }
  private async update(threadId: string, work:(view:ProjectView)=>Promise<void>) {
    const existing=await this.get(threadId);if(!existing)throw new Error('请先打开当前会话项目');
    return this.lock(existing.project.id,async()=>{const view=(await this.get(threadId))!;if(view.project.id!==existing.project.id)throw new Error('会话项目已切换，请重新读取项目');await work(view);await this.save(view.project);return (await this.get(threadId))!;});
  }
  async plan(threadId:string,pages:{path:string;title:string}[]) {
    return this.update(threadId,async({project})=>{for(const page of pages){this.path(page.path,true);const current=project.pages.find(item=>item.path===page.path);if(current)current.title=page.title;else project.pages.push({...page,status:'queued',version:0});}});
  }
  async begin(threadId:string,paths:string[]) {
    return this.update(threadId,async({project})=>{for(const path of paths){this.path(path,true);const page=project.pages.find(item=>item.path===path);if(!page)throw new Error(`页面未在计划内：${path}`);page.status='generating';page.version++;delete page.error;}});
  }
  private async complete(view:ProjectView,paths:string[]) {
    for(const path of paths){const page=view.project.pages.find(item=>item.path===path);if(!page)throw new Error(`页面未在计划内：${path}`);
      try {
        const file=await this.target(view.project.id,path),html=await readFile(file,'utf8');
        if(!/<html\b/i.test(html)||!/<\/html>\s*$/i.test(html)||!/<body\b/i.test(html))throw new Error('HTML 尚未完整输出');
        for(const match of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+\.(?:js|css))(?:\?[^"']*)?["']/gi)){
          if(/^(?:[a-z]+:|\/\/)/i.test(match[1]))continue;
          const relativePath=relative(view.directory,resolve(dirname(file),match[1])).split(sep).join('/');await stat(await this.target(view.project.id,relativePath));
        }
        page.status='ready';page.version++;delete page.error;
      } catch(error){page.status='error';page.error=(error as Error).message;page.version++;}
    }
  }
  async finish(threadId:string,paths:string[]) {return this.update(threadId,async view=>{await this.complete(view,paths);});}
  private async usesFiles(view:ProjectView,page:string,changed:Set<string>) {
    const document=resolve(view.directory,page),visited=new Set<string>();
    const visit=async(file:string):Promise<boolean>=>{
      const path=relative(view.directory,file).split(sep).join('/');
      if(changed.has(path))return true;
      if(visited.has(file))return false;visited.add(file);
      if(!/\.(?:html?|js|css)$/i.test(file))return false;
      let text:string;try{text=await readFile(await this.target(view.project.id,path),'utf8');}catch{return false;}
      // Match resources embedded by the snapshot compiler. Classic JS URLs resolve
      // against the document; CSS URLs resolve against the stylesheet itself.
      const refs=[...text.matchAll(/(?:\b(?:src|href)\s*=\s*["']|url\(\s*["']?|["'`])([^"'`\s<>)]*\.(?:js|css|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|json)(?:[?#][^"'`\s<>)]*)?)/gi)];
      for(const match of refs){const url=match[1].replaceAll('&amp;','&');if(/^(?:[a-z]+:|\/\/|#)/i.test(url))continue;
        const target=url.startsWith('/')?resolve(view.directory,url.slice(1).split(/[?#]/)[0]):resolve(dirname(/\.js$/i.test(file)?document:file),url.split(/[?#]/)[0]);
        if(await visit(target))return true;
      }
      return false;
    };
    return visit(document);
  }
  async write(threadId:string,files:{path:string;content:string;fragment?:boolean;title?:string}[],finalizePages?:string[]) {
    if(!files.length)throw new Error('没有文件内容');
    files.forEach(file=>this.path(file.path));
    return this.update(threadId,async view=>{
      for(const file of files)if(/\.html?$/i.test(file.path)&&!view.project.pages.some(page=>page.path===file.path))throw new Error(`请先将页面加入计划：${file.path}`);
      for(const file of files){const page=view.project.pages.find(page=>page.path===file.path);if(page&&file.title)page.title=file.title;}
      const output=files.map(file=>({...file,content:file.fragment?assemblePage(file.content,file.title||view.project.pages.find(page=>page.path===file.path)?.title||view.project.name,view.project.language):file.content}));
      const changed=new Set<string>();
      for(const file of output){const target=await this.target(view.project.id,file.path);if(await readFile(target,'utf8').catch(()=>null)!==file.content)changed.add(file.path);}
      const affected:ProjectPage[]=[];
      for(const page of view.project.pages)if(changed.has(page.path)||await this.usesFiles(view,page.path,changed))affected.push(page);
      const previouslyReady=affected.filter(page=>page.status==='ready').map(page=>page.path);
      for(const page of affected){page.status='generating';page.version++;delete page.error;}
      // Publish generating before any write; an old finished page must disappear immediately.
      await this.save(view.project);
      for(const file of output)if(changed.has(file.path))await atomic(await this.target(view.project.id,file.path),file.content);
      const complete=[...new Set([...(finalizePages||files.filter(file=>/\.html?$/i.test(file.path)&&view.project.pages.find(page=>page.path===file.path)?.status!=='ready').map(file=>file.path)),...previouslyReady])];
      await this.complete(view,complete);
    });
  }
  async wait(since:string,threadId?:string,waitMs=20000) {
    const deadline=Date.now()+Math.min(Math.max(waitMs,0),20000);let view=await this.get(threadId);
    while((view?.revision||'none')===since&&Date.now()<deadline){await pause(Math.min(250,deadline-Date.now()));view=await this.get(threadId);}
    return view;
  }
}
