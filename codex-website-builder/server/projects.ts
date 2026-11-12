import { mkdir, readFile, rename, writeFile, open, unlink, realpath, stat, readdir } from 'node:fs/promises';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { assemblePage, injectSharedUI } from './assemble';
import { formatSource } from './format-source';
import { fileURLToPath } from 'node:url';
import { regionMarkers, type TemplateBinding } from './template-source';
import { readTemplates } from './templates';
import { ProjectDatabase } from './database';

export type PageState = 'queued'|'generating'|'ready'|'error';
export interface ProjectPage { path: string; title: string; status: PageState; version: number; error?: string; generationHash?: string; resourceSignature?: string }
export interface WebsiteProject { id: string; name: string; brief: string; language: string; revision: string; pages: ProjectPage[]; updatedAt: string }
export interface ProjectView { project: WebsiteProject; threadId: string; directory: string; metadataDirectory: string; revision: string }
export const DEFAULT_PAGES = ['index','shop','product','wishlist','checkout','login','register','about','contact','terms','privacy','return'].map(name=>({path:`${name}.html`,title:name}));
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
  readonly skillRoot = (process.env.WEBSITE_BUILDER_SKILL_ROOT || fileURLToPath(new URL('../../skills/website-builder/', import.meta.url))).replaceAll('${PLUGIN_ROOT}', fileURLToPath(new URL('../../', import.meta.url)));
  readonly stateRoot: string;
  readonly database: ProjectDatabase;
  constructor(readonly root: string) { this.root=resolve(root);this.stateRoot=join(dirname(this.root),'.builder-state');this.database=new ProjectDatabase(dirname(this.root),this.root,this.stateRoot); }
  private binding(thread: string) { if(!thread.trim())throw new Error('需要当前真实 thread_id，不能使用共享匿名会话');return join(this.stateRoot,'threads',createHash('sha256').update(thread).digest('hex')+'.json'); }
  private folder(id: string) { if(!idPattern.test(id))throw new Error('项目 ID 无效');return join(this.root,id); }
  metadataDirectory(id: string) { this.folder(id); return join(this.stateRoot,'projects',id); }
  private manifest(id: string) { return join(this.metadataDirectory(id),'project.json'); }
  private async loadProject(id:string) { return this.database.project(id); }
  private async lock<T>(key: string, run: ()=>Promise<T>): Promise<T> {
    await mkdir(join(this.stateRoot,'locks'),{recursive:true});const file=join(this.stateRoot,'locks',createHash('sha256').update(key).digest('hex')+'.lock');
    let handle: Awaited<ReturnType<typeof open>> | undefined;
    for(let attempt=0;attempt<100;attempt++) { try {handle=await open(file,'wx');break;}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;const info=await stat(file).catch(()=>null);if(info&&Date.now()-info.mtimeMs>120000)await unlink(file).catch(()=>{});await pause(50);} }
    if(!handle)throw new Error('项目正在写入，请稍后重试');
    try{return await run();}finally{await handle.close();await unlink(file).catch(()=>{});}
  }
  private async save(project: WebsiteProject) {project.revision=randomUUID();project.updatedAt=new Date().toISOString();this.database.save(project);await atomic(this.manifest(project.id),JSON.stringify(project,null,2));}
  async get(threadId?: string, projectId?: string): Promise<ProjectView | null> {
    const binding = this.database.binding(threadId);
    const id=projectId || binding?.projectId;if(!id)return null;
    const project=await this.loadProject(id);if(!project){if(!projectId)return null;throw new Error('项目不存在或已删除');}
    const base=await realpath(this.root),folder=await realpath(this.folder(id)),rel=relative(base,folder);if(rel==='..'||rel.startsWith(`..${sep}`)||isAbsolute(rel))throw new Error('项目目录不能指向外部');
    const currentThread=threadId || binding?.threadId || '';
    return {project,threadId:currentThread,directory:this.folder(id),metadataDirectory:this.metadataDirectory(id),revision:`${id}:${currentThread}:${project.revision}`};
  }
  async list() {await mkdir(this.root,{recursive:true});return this.database.list();}
  async templateUsage() {
    const usage:Record<string,{projects:number;lastUsed?:string}>={};
    for(const project of await this.list()) {
      let data:any;
      try { data=await json<any>(join(this.metadataDirectory(project.id),'website-builder.templates.json')) || await json<any>(join(this.folder(project.id),'website-builder.templates.json')); } catch { continue; }
      const items=Array.isArray(data)?data:Array.isArray(data?.bindings)?data.bindings:Object.values(data||{});
      const ids=new Set<string>(items.map((item:any)=>typeof item==='string'?item:item?.id).filter((id:any)=>typeof id==='string'&&/^[a-z]+-[0-9]+$/.test(id)));
      for(const id of ids){const previous=usage[id];usage[id]={projects:(previous?.projects||0)+1,lastUsed:previous?.lastUsed&&previous.lastUsed>project.updatedAt?previous.lastUsed:project.updatedAt};}
    }
    return usage;
  }
  async createProject(input: {name?:string;brief?:string;language?:string;pages?:{path:string;title:string}[]}) {
    const id=randomBytes(8).toString('hex').match(/.{4}/g)!.join('-');
    const pages=(input.pages || DEFAULT_PAGES).map(page=>({...page,path:this.path(page.path,true),status:'queued' as const,version:0}));
    if(new Set(pages.map(page=>page.path)).size!==pages.length)throw new Error('页面路径重复');
    const project:WebsiteProject={id,name:input.name||'Ecommerce website',brief:input.brief||'',language:input.language||'en',revision:'',pages,updatedAt:''};
    await mkdir(this.folder(id),{recursive:true});await this.save(project);
    return {project,threadId:'',directory:this.folder(id),metadataDirectory:this.metadataDirectory(id),revision:`${id}::${project.revision}`};
  }
  async open(input: {threadId:string;projectId?:string;newProject?:boolean;name?:string;brief?:string;language?:string;pages?:{path:string;title:string}[]}) {
    return this.lock(`thread:${input.threadId}`,async()=>{
      let view = input.newProject ? null : await this.get(input.threadId,input.projectId);
      if(!view) {
        if(input.projectId)throw new Error('指定项目不存在，不会用相同名字创建替代项目');
        const created=await this.createProject(input);
        view={...created,threadId:input.threadId,revision:`${created.project.id}:${input.threadId}:${created.project.revision}`};
      }
      const binding={threadId:input.threadId,projectId:view.project.id};
      this.database.setActive(binding);
      await atomic(this.binding(input.threadId),JSON.stringify(binding));await atomic(join(this.stateRoot,'active.json'),JSON.stringify(binding));
      return view;
    });
  }
  path(value: string, htmlOnly=false) {
    if(isAbsolute(value)||value.includes('\\')||value.includes('\0')||value.split('/').some(part=>!part||part==='.'||part==='..'||part.startsWith('.'))||/[:<>"|?*]/.test(value))throw new Error('只允许项目内的相对文件路径');
    if(htmlOnly&&!/\.html?$/i.test(value))throw new Error('页面必须是 HTML 文件');return value;
  }
  private async target(id: string, value: string) {
    const path=this.path(value), metadata=/^website-builder\.[a-z-]+\.json$/.test(path);
    if(metadata)await mkdir(this.metadataDirectory(id),{recursive:true});
    const root=await realpath(metadata?this.metadataDirectory(id):this.folder(id));
    if(metadata){const base=await realpath(this.stateRoot),rel=relative(base,root);if(rel==='..'||rel.startsWith(`..${sep}`)||isAbsolute(rel))throw new Error('管理目录不能指向外部');}
    let folder=root;
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
    return this.update(threadId,async({project})=>{for(const path of paths){this.path(path,true);const page=project.pages.find(item=>item.path===path);if(!page)throw new Error(`页面未在计划内：${path}`);page.generationHash=await this.sourceHash(project.id,path);page.status='generating';page.version++;delete page.error;}});
  }
  private async sourceHash(id:string,path:string) {
    const source=await readFile(await this.target(id,path)).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
    return source?createHash('sha256').update(source).digest('hex'):'';
  }
  private async resourceSignature(view:ProjectView,page:string) {
    const hash=createHash('sha256'),visited=new Set<string>(),base=await realpath(view.directory);
    const visit=async(path:string):Promise<void>=>{
      if(visited.has(path))return;visited.add(path);hash.update(path);
      let file:string;
      try{
        file=await realpath(resolve(view.directory,path));const rel=relative(base,file);
        if(rel==='..'||rel.startsWith(`..${sep}`)||isAbsolute(rel))throw new Error('Resource outside project');
        const info=await stat(file);hash.update(`${info.size}:${info.mtimeMs}`);
      }catch{hash.update(':missing');return;}
      if(!/\.(?:html?|js|mjs|css)$/i.test(path))return;
      const source=await readFile(file,'utf8');
      for(const match of source.matchAll(/(?:\b(?:src|href|srcset)\s*=\s*["']|url\(\s*["']?|["'`])([^"'`\s<>)]*\.(?:js|mjs|css|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf|mp4|mp3|json)(?:[?#][^"'`\s<>)]*)?)/gi)){
        const url=match[1].replaceAll('&amp;','&');if(/^(?:[a-z]+:|\/\/|#)/i.test(url))continue;
        try{
          const value=decodeURIComponent(url.split(/[?#]/)[0]);
          const directory=/\.m?js$/i.test(path)?dirname(resolve(base,page)):dirname(file);
          const target=value.startsWith('/')?resolve(base,value.slice(1)):resolve(directory,value);
          const rel=relative(base,target).split(sep).join('/');this.path(rel);await visit(rel);
        }catch{hash.update(':invalid-reference');}
      }
    };
    await visit(page);return hash.digest('hex');
  }
  // Direct-file generation may finish without a tool callback. Only a complete,
  // changed document can leave generating; begin must not redisplay the old file.
  async reconcile(threadId?:string) {
    const view=await this.get(threadId);if(!view)return null;
    const candidates=async(current:ProjectView)=>{
      const paths:string[]=[];
      for(const page of current.project.pages){
        if(page.status==='ready'||page.status==='error'&&page.resourceSignature){
          if(page.resourceSignature!==await this.resourceSignature(current,page.path))paths.push(page.path);
          continue;
        }
        if(page.status!=='generating'||page.generationHash===undefined)continue;
        const source=await readFile(await this.target(current.project.id,page.path),'utf8').catch(()=>null);
        if(source&&/<html\b/i.test(source)&&/<body\b/i.test(source)&&/<\/body>/i.test(source)&&/<\/html>\s*$/i.test(source)&&createHash('sha256').update(source).digest('hex')!==page.generationHash)paths.push(page.path);
      }
      return paths;
    };
    if(!(await candidates(view)).length)return view;
    return this.update(view.threadId,async current=>{await this.complete(current,await candidates(current));});
  }
  async bindTemplates(threadId: string, bindings: TemplateBinding[]) {
    for (const binding of bindings) {
      this.path(binding.file);
      if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(binding.region)) throw new Error('区域名只允许小写字母、数字、下划线和短横线');
      await readTemplates(this.skillRoot, { mode: 'doc', ids: [binding.id] });
    }
    const view = await this.update(threadId, async view => {
      const file = await this.target(view.project.id, 'website-builder.templates.json');
      const previous = await json<{ bindings: TemplateBinding[] }>(file) || await json<{bindings:TemplateBinding[]}>(join(view.directory,'website-builder.templates.json'));
      const merged = [...(previous?.bindings || [])];
      for (const binding of bindings) {
        const index = merged.findIndex(item => item.file === binding.file && item.region === binding.region);
        if (index >= 0) merged[index] = binding; else merged.push(binding);
      }
      await atomic(file, JSON.stringify({ version: 2, purpose: "source-trace-only", bindings: merged }, null, 2));
    });
    return { project_id: view.project.id, bindings: bindings.map(binding => ({ ...binding, ...regionMarkers(binding) })), advisory: true };
  }
  async auditTemplates(threadId: string) {
    const view = await this.get(threadId);
    if (!view) throw new Error('请先打开当前会话项目');
    const sources = await json<{bindings?:TemplateBinding[]}>(await this.target(view.project.id, 'website-builder.templates.json')) || await json<{bindings?:TemplateBinding[]}>(join(view.directory,'website-builder.templates.json'));
    return { advisory: true, configured: !!sources, bindings: sources?.bindings || [], message: 'Template fidelity is SKILL guidance only. No structure score or generation pass/fail is calculated. Page readiness uses complete HTML and local dependency validation.' };
  }
  private async complete(view:ProjectView,paths:string[]) {
    for(const path of paths){const page=view.project.pages.find(item=>item.path===path);if(!page)throw new Error(`页面未在计划内：${path}`);
      try {
        const file=await this.target(view.project.id,path);let html=await readFile(file,'utf8');
        if(!/<html\b/i.test(html)||!/<\/html>\s*$/i.test(html)||!/<body\b/i.test(html)||!/<\/body>/i.test(html))throw new Error('HTML 尚未完整输出');
        const toastPath=await this.target(view.project.id,'components/toast.js');
        if(!await stat(toastPath).catch(()=>null))await atomic(toastPath,await formatSource('components/toast.js',await readFile(join(this.skillRoot,'assets/ui/toast.js'),'utf8')));
        const enhanced=await formatSource(path,injectSharedUI(html,path));if(enhanced!==html){await atomic(file,enhanced);html=enhanced;}
        for(const match of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+\.(?:js|css))(?:\?[^"']*)?["']/gi)){
          if(/^(?:[a-z]+:|\/\/)/i.test(match[1]))continue;
          // Keep both operands in the configured path namespace (e.g. macOS
          // /var vs /private/var); target() still validates realpath containment.
          const relativePath=relative(view.directory,resolve(dirname(resolve(view.directory,path)),match[1])).split(sep).join('/');await stat(await this.target(view.project.id,relativePath));
        }
        page.status='ready';page.version++;delete page.error;delete page.generationHash;
      } catch(error){page.status='error';page.error=(error as Error).message;page.version++;delete page.generationHash;}
      page.resourceSignature=await this.resourceSignature(view,path);
    }
  }
  async finish(threadId:string,paths:string[]) {return this.update(threadId,async view=>{await this.complete(view,paths.length?paths:view.project.pages.filter(page=>page.status!=='ready').map(page=>page.path));});}
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
      const refs=[...text.matchAll(/(?:\b(?:src|href)\s*=\s*["']|url\(\s*["']?|["'`])([^"'`\s<>)]*\.(?:js|css|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf|mp4|mp3|json)(?:[?#][^"'`\s<>)]*)?)/gi)];
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
    files.forEach(file=>{
      this.path(file.path);
      if(/(?:^|\/)(?:tmp|temp|artifacts|test-results|playwright-report)(?:\/|$)|\.(?:tmp|bak|log|psd)$/i.test(file.path))throw new Error('网站输出目录是生产目录；临时文件、报告与源素材请保存到 metadata_directory');
    });
    return this.update(threadId,async view=>{
      for(const path of finalizePages||[])if(!view.project.pages.some(page=>page.path===path))throw new Error(`页面未在计划内：${path}`);
      for(const file of files)if(/\.html?$/i.test(file.path)&&!view.project.pages.some(page=>page.path===file.path))throw new Error(`请先将页面加入计划：${file.path}`);
      for(const file of files){const page=view.project.pages.find(page=>page.path===file.path);if(page&&file.title)page.title=file.title;}
      const hasFile=async(path:string)=>files.some(file=>file.path===path)||!!await stat(join(view.directory,path)).catch(()=>null);
      const commerce=await hasFile('js/ec-sdk.js')&&await hasFile('js/sdk.js');
      const commerceConfig=commerce&&await hasFile('js/commerce-config.js');
      const cart = !await hasFile('components/cart.js') ? 'none' : view.project.pages.some(page=>/(^|\/)cart\.html?$/i.test(page.path)) ? 'page' : 'drawer';
      const output=await Promise.all(files.map(async file=>({...file,content:await formatSource(file.path,/\.html?$/i.test(file.path)?injectSharedUI(file.fragment?assemblePage(file.content,file.title||view.project.pages.find(page=>page.path===file.path)?.title||view.project.name,view.project.language,{commerce,commerceConfig,cart}):file.content,file.path):file.content)}))).catch(async error=>{
        const submitted=new Set(files.map(file=>file.path));
        for(const page of view.project.pages)if(page.status!=='ready'&&(submitted.has(page.path)||page.status==='generating'&&await this.usesFiles(view,page.path,submitted))){page.status='error';page.error=`代码格式/语法校验失败：${(error as Error).message}`;page.version++;delete page.generationHash;}
        await this.save(view.project);throw error;
      });
      if(output.some(file=>/\.html?$/i.test(file.path)&&/<toast-component\b/i.test(file.content))&&!await hasFile('components/toast.js'))output.push({path:'components/toast.js',content:await formatSource('components/toast.js',await readFile(join(this.skillRoot,'assets/ui/toast.js'),'utf8'))});
      const changed=new Set<string>();
      for(const file of output){const target=await this.target(view.project.id,file.path);if(await readFile(target,'utf8').catch(()=>null)!==file.content)changed.add(file.path);}
      const affected:ProjectPage[]=[];
      for(const page of view.project.pages)if(changed.has(page.path)||await this.usesFiles(view,page.path,changed))affected.push(page);
      for(const page of affected){page.status='generating';page.version++;delete page.error;delete page.generationHash;}
      // Publish generating before any write; an old finished page must disappear immediately.
      await this.save(view.project);
      try {
        for(const file of output)if(changed.has(file.path))await atomic(await this.target(view.project.id,file.path),file.content);
      } catch(error) {
        for(const page of affected){page.status='error';page.error=`文件写入失败：${(error as Error).message}`;page.version++;}
        await this.save(view.project);throw error;
      }
      // Explicit finalize paths are additive. Even [] cannot suppress validation
      // of submitted HTML or pages whose missing dependencies just arrived.
      const complete=[...new Set([...(finalizePages||[]),...files.filter(file=>/\.html?$/i.test(file.path)).map(file=>file.path),...affected.map(page=>page.path)])];
      await this.complete(view,complete);
    });
  }
  async wait(since:string,threadId?:string,waitMs=20000) {
    const deadline=Date.now()+Math.min(Math.max(waitMs,0),20000);let view=await this.reconcile(threadId);
    while((view?.revision||'none')===since&&Date.now()<deadline){await pause(Math.min(250,deadline-Date.now()));view=await this.reconcile(threadId);}
    return view;
  }
}
