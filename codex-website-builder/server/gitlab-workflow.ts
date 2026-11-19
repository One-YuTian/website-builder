import fs from 'node:fs';
import {readFile,readdir,lstat,stat,mkdir,rename,writeFile,realpath} from 'node:fs/promises';
import {join,relative,isAbsolute,sep} from 'node:path';
import {domainToASCII} from 'node:url';
import {randomUUID,createHash} from 'node:crypto';
import {createRequire as createGitRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import type {ProjectStore,ProjectView} from './projects';
import {PluginSettings,settingsDigest,type GitLabSettings} from './plugin-settings';
import {gitlabHost,gitlabPath,gitlabGroupPath,nodeGitLabIO,type GitLabIO} from './gitlab-transport';
import {assertMainRepository,commitProject} from './project-layout';
import {assertEditable,operationLock} from './project-operations';

export type GitLabIntent='create'|'bind'|'commit'|'push'|'deploy';
export type DeployEnvironment='test'|'production';
export function websiteDomain(value:string){
  const domain=domainToASCII(value.trim().toLowerCase());
  if(!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain))throw Error('请确认真实官网域名，格式如 example.com 或 www.example.com，不含协议、端口或路径');return domain;
}
export function releaseName(environment:DeployEnvironment,date=new Date()){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',year:'2-digit',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(p=>[p.type,p.value]));
  return `${environment==='production'?'release':'test'}-${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}`;
}
async function fileFingerprint(root:string){
  const hash=createHash('sha256');
  const scan=async(folder:string):Promise<void>=>{for(const entry of (await readdir(folder,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
    if(entry.name==='.git'&&folder===root)continue;
    const file=join(folder,entry.name);if(entry.isSymbolicLink())throw Error('GIT_CONFIRMATION_REQUIRED：项目含符号链接，先确认并由系统 Git 处理');
    if(entry.isDirectory())await scan(file);else if(entry.isFile()){hash.update(relative(root,file));hash.update(await readFile(file));}
  }};await scan(root);return hash.digest('hex');
}
type Input={project_id:string;actor:string;intent:GitLabIntent;domain:string;environment?:DeployEnvironment};
type Plan=Input&{id:string;kind:'create'|'bind'|'publish'|'commit'|'push';force_overwrite?:boolean;config:string;files:string;index:string;local:string;remote:string|null;deploy:string;repository:string;deploy_repository:string;deploy_branch:string;gitlab_user:string;uncommitted:boolean;choices:string[];checks:string[];expires_at:number};
export class GitLabWorkflow {
  private git:any;
  private active=new Map<string,AbortController>();
  private owners=new WeakMap<GitLabSettings,string>();
  private cancelled(id:string){return (this.store.database.sql.prepare('SELECT used FROM deployment_requests WHERE id=?').get(id) as any)?.used===2;}
  private checkpoint(id:string){if(this.cancelled(id))throw Error('DEPLOYMENT_CANCELLED：发布任务已取消，已完成的仓库操作予以保留，未创建发布标签');}
  private begin(id:string){const controller=new AbortController();this.active.set(id,controller);let heartbeat=0;const timer=setInterval(()=>{if(this.cancelled(id))controller.abort();if(Date.now()-heartbeat>=10000){heartbeat=Date.now();this.store.database.sql.prepare('UPDATE deployment_locks SET expires_at=? WHERE owner=?').run(Date.now()+120000,id);}},100);return()=>{clearInterval(timer);this.active.delete(id);};}
  private signal(c:GitLabSettings){const id=this.owners.get(c);if(id)this.checkpoint(id);return id?this.active.get(id)?.signal:undefined;}
  constructor(readonly store:ProjectStore,readonly settings:PluginSettings,private io:GitLabIO=nodeGitLabIO(),git?:any,private now=()=>new Date()){
    this.git=git||createGitRequire(import.meta.url)(fileURLToPath(new URL('../runtime/isomorphic-git/load.cjs',import.meta.url)));
  }
  private options(view:ProjectView){return {fs,dir:view.projectDirectory.replaceAll('\\','/')};}
  private save(id:string,value:unknown){this.store.database.sql.prepare('INSERT INTO settings VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('gitlab:'+id,JSON.stringify(value));}
  status(id:string){
    const lock=operationLock(this.store.database,id),row=this.store.database.sql.prepare('SELECT value FROM settings WHERE key=?').get('gitlab:'+id) as any;
    const binding=this.store.database.sql.prepare('SELECT value FROM settings WHERE key=?').get('gitlab-binding:'+id) as any;
    const project=this.store.database.project(id);
    const last=row?JSON.parse(row.value):null;
    const request=lock?this.store.database.sql.prepare('SELECT used FROM deployment_requests WHERE id=?').get(lock.owner) as any:null;
    return {locked:!!lock,cancellable:!!lock&&request?.used!==3,stage:lock?.stage||'',domain:project?.domain||(binding?JSON.parse(binding.value).domain:'')||last?.domain||'',last};
  }
  async updateDomain(id:string,domain:string){
    const saved=await this.store.setDomain(id,domain);
    return {domain:saved};
  }
  challenge(id:string,actor:string,projectId:string){
    const row=this.store.database.sql.prepare('SELECT * FROM deployment_requests WHERE id=? AND project_id=?').get(id,projectId) as any;
    if(!row||row.thread_id!==actor||row.used||row.expires_at<Date.now())throw Error('确认请求无效、过期或已经使用');
    const plan=JSON.parse(row.data) as Plan;if(!plan.kind)throw Error('检查尚未完成');return plan;
  }
  private stage(id:string,owner:string,stage:string){if(stage!=='正在取消')this.checkpoint(owner);assertEditable(this.store.database,id,owner);this.store.database.sql.prepare('UPDATE deployment_locks SET stage=? WHERE project_id=? AND owner=?').run(stage,id,owner);}
  private release(id:string,owner:string){this.store.database.sql.prepare('DELETE FROM deployment_locks WHERE project_id=? AND owner=?').run(id,owner);}
  cancel(id:string,actor:string,requestId?:string){
    let owner=requestId||operationLock(this.store.database,id)?.owner;if(!owner)return {status:'cancelled'};
    const row=this.store.database.sql.prepare('SELECT thread_id FROM deployment_requests WHERE id=? AND project_id=?').get(owner,id) as any;
    if(row?.thread_id!==actor)throw Error('不能取消其他会话的部署');
    const lock=operationLock(this.store.database,id);if(lock&&lock.owner!==owner){const next=this.store.database.sql.prepare('SELECT thread_id FROM deployment_requests WHERE id=?').get(lock.owner) as any;if(next?.thread_id!==actor)throw Error('不能取消其他会话的部署');owner=lock.owner;}
    const current=this.store.database.sql.prepare('SELECT used FROM deployment_requests WHERE id=?').get(owner) as any;
    if(current?.used===3)throw Error('创建发布标签的请求已发出，请等待结果，不能取消或重复发布');
    if(current?.used===2)return {status:lock?'cancelling':'cancelled'};
    if(!lock)return {status:'cancelled'};
    const running=current?.used===1;
    this.store.database.sql.prepare('UPDATE deployment_requests SET used=2 WHERE id=? AND used IN (0,1)').run(owner);
    this.active.get(owner)?.abort();
    if(running){this.stage(id,owner,'正在取消');return {status:'cancelling'};}
    this.release(id,owner);return {status:'cancelled'};
  }
  private async api(c:GitLabSettings,method:string,path:string,body?:unknown,missing=false){
    const response=await this.io.api(c,method,path,body,this.signal(c));
    this.signal(c);
    if(missing&&response.status===404)return null;
    if(response.status<200||response.status>=300)throw Error(`GitLab API ${method} ${path.split('?')[0]} 返回 ${response.status}，请检查Token权限及地址`);
    return response.data;
  }
  private async context(input:Input,owner:string){
    const c=await this.settings.get();
    this.owners.set(c,owner);this.signal(c);
    for(const name of ['GITLAB_HOST','GITLAB_IP','GITLAB_TOKEN','GITLAB_WEBSITE_DIR','GITLAB_WEBSITE_DEPLOY_DIR'] as const)if(!c[name])throw Error(`请在插件配置页填写 ${name}`);
    if(!/^[\w./-]+$/.test(c.GITLAB_DEFAULT_BRANCH)||c.GITLAB_DEFAULT_BRANCH.includes('..')||c.GITLAB_DEFAULT_BRANCH.endsWith('/'))throw Error('GITLAB_DEFAULT_BRANCH 无效');
    const view=await this.store.get(undefined,input.project_id);if(!view)throw Error('项目不存在');
    const checks:string[]=[];const step=async(name:string,run:()=>Promise<any>)=>{this.stage(input.project_id,owner,name);const data=await run();checks.push(name);return data;};
    await step('连接 GitLab IP',()=>this.io.probe(c,this.signal(c)));
    const user=await step('验证 Token 用户',()=>this.api(c,'GET','/user'));
    if(!Number.isInteger(user?.id)||!user.username||user.state&&user.state!=='active')throw Error('GitLab Token 用户无效或已停用');
    const host=gitlabHost(c.GITLAB_HOST),groupPath=gitlabGroupPath(c.GITLAB_WEBSITE_DIR,host),deployPath=gitlabPath(c.GITLAB_WEBSITE_DEPLOY_DIR,host);
    const group=await step('验证网站分组',()=>this.api(c,'GET','/groups/'+encodeURIComponent(groupPath)));
    if(!Number.isInteger(group?.id)||group.full_path!==groupPath)throw Error('GitLab 网站分组地址不匹配');
    const deployment=await step('验证部署仓库',()=>this.api(c,'GET','/projects/'+encodeURIComponent(deployPath)));
    if(!Number.isInteger(deployment?.id)||deployment.archived||deployment.path_with_namespace!==deployPath)throw Error('GitLab 部署仓库地址不匹配');
    const deployBranch=await step('验证部署基准分支',()=>this.api(c,'GET',`/projects/${deployment.id}/repository/branches/${encodeURIComponent(c.GITLAB_DEFAULT_BRANCH)}`));
    if(!/^[0-9a-f]{40}$/.test(deployBranch?.commit?.id||''))throw Error('部署基准分支没有有效版本');
    const repoPath=group.full_path+'/'+input.domain;
    if(repoPath===deployPath)throw Error('网站仓库不能与部署仓库相同');
    const remote=await step('验证官网仓库',()=>this.api(c,'GET','/projects/'+encodeURIComponent(repoPath),undefined,true));
    let branch:any=null,empty=true;
    const url=host+'/'+repoPath+'.git';
    if(remote){
      if(!Number.isInteger(remote.id)||remote.archived||remote.path!==input.domain||remote.path_with_namespace!==repoPath||remote.http_url_to_repo!==url)throw Error('官网仓库名称、分组或Git地址不匹配');
      const branches=await this.api(c,'GET',`/projects/${remote.id}/repository/branches?per_page=1`);
      const tags=await this.api(c,'GET',`/projects/${remote.id}/repository/tags?per_page=1`);
      if(!Array.isArray(branches)||!Array.isArray(tags))throw Error('无法确认官网仓库版本');
      empty=branches.length===0&&tags.length===0&&remote.empty_repo===true;
      if(!empty){
        if(remote.default_branch!=='main')throw Error('GIT_CONFIRMATION_REQUIRED：官网云端分支不是main，请用户确认后通过系统Git处理');
        branch=await this.api(c,'GET',`/projects/${remote.id}/repository/branches/main`);
        if(!/^[0-9a-f]{40}$/.test(branch?.commit?.id||''))throw Error('官网仓库main没有有效版本');
        if(branch.can_push===false&&input.intent!=='bind')throw Error('Token 无权推送官网main分支');
      }
    }
    await step('验证本地分支与项目',async()=>{await assertMainRepository(view.projectDirectory);});
    const local=await this.git.resolveRef({...this.options(view),ref:'refs/heads/main'});
    return {c,view,user,group,deployment,deployBranch,remote,branch,empty,url,local,checks};
  }
  private async ready(view:ProjectView){
    if(!view.project.pages.length||view.project.pages.some(page=>page.status!=='ready'))throw Error('官网页面尚未全部完成，请先完成生成和校验');
    const tasks=this.store.database.sql.prepare("SELECT path FROM image_tasks WHERE project_id=? AND status='generating'").all(view.project.id);
    if(tasks.length)throw Error('图片生成尚未全部完成，不能发布');
    for(const page of view.project.pages){
      const path=this.store.path(page.path,true),html=await readFile(join(view.directory,path),'utf8');
      if(!/<html\b/i.test(html)||!/<\/body>/i.test(html)||!/<\/html>\s*$/i.test(html))throw Error('页面源码未完整输出：'+path);
      for(const match of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+\.(?:js|css|png|jpe?g|webp|avif|svg|ico))(?:\?[^"']*)?["']/gi)){
        if(/^(?:[a-z]+:|\/\/)/i.test(match[1])||/[${}]/.test(match[1]))continue;
        const url=new URL(match[1],'https://site.invalid/'+path);const file=decodeURIComponent(url.pathname.slice(1));this.store.path(file);await stat(join(view.directory,file));
      }
    }
  }
  private async hasConflict(ctx:Awaited<ReturnType<GitLabWorkflow['context']>>){
    if(!ctx.branch||ctx.branch.commit.id===ctx.local)return false;
    await this.git.fetch({...this.options(ctx.view),http:this.io.http(ctx.c,this.signal(ctx.c)),url:ctx.url,remote:'origin',ref:'main',singleBranch:true,onAuth:()=>({username:'oauth2',password:ctx.c.GITLAB_TOKEN})});
    return !(await this.git.isDescendent({...this.options(ctx.view),oid:ctx.local,ancestor:ctx.branch.commit.id}).catch(()=>false));
  }
  private async origin(view:ProjectView){return await this.git.getConfig({...this.options(view),path:'remote.origin.url'})||'';}
  private async snapshot(view:ProjectView){return {files:await fileFingerprint(view.projectDirectory),index:createHash('sha256').update(await readFile(join(view.projectDirectory,'.git/index')).catch(()=>Buffer.alloc(0))).digest('hex')};}
  private async trackedSource(view:ProjectView){
    const tracked=new Set<string>(await this.git.listFiles(this.options(view)));
    const scan=async(folder:string):Promise<void>=>{for(const entry of await readdir(folder,{withFileTypes:true})){
      const file=join(folder,entry.name);
      if(entry.isDirectory())await scan(file);
      else if(entry.isFile()&&!tracked.has(relative(view.projectDirectory,file).split(sep).join('/')))throw Error('源码未被Git跟踪（可能被.gitignore排除），不能发布：'+relative(view.directory,file));
    }};await scan(view.directory);
  }
  async prepare(raw:Input,replacingOwner?:string){
    const input={...raw,domain:websiteDomain(raw.domain)};
    if(input.intent==='deploy'&&!['test','production'].includes(input.environment||''))throw Error('必须明确选择测试或正式环境');
    if(input.intent==='deploy'&&!replacingOwner){
      if(this.store.database.status(input.project_id)!=='completed')throw Error('项目尚未完成，暂不能部署，请先完成或修复当前任务');
      if(this.store.database.sql.prepare("SELECT path FROM image_tasks WHERE project_id=? AND status='generating' LIMIT 1").get(input.project_id)||this.store.database.sql.prepare("SELECT path FROM image_compressions WHERE project_id=? AND status='running' AND lease_until>? LIMIT 1").get(input.project_id,Date.now()))throw Error('图片仍在生成或压缩，暂不能部署');
    }
    const id=randomUUID(),expires=Date.now()+10*60*1000;
    await this.store.exclusive(input.project_id,async()=>{
      if(replacingOwner)this.checkpoint(replacingOwner);
      const inserted=this.store.database.sql.prepare("INSERT INTO deployment_locks VALUES (?,?,?,'检查中') ON CONFLICT(project_id) DO UPDATE SET owner=excluded.owner,expires_at=excluded.expires_at,stage=excluded.stage WHERE deployment_locks.expires_at<=? OR deployment_locks.owner=?").run(input.project_id,id,expires,Date.now(),replacingOwner||'');
      if(!inserted.changes)throw Error('项目已有部署任务或确认窗口，请先完成或取消');
      this.store.database.sql.prepare('INSERT INTO deployment_requests(id,project_id,thread_id,data,expires_at,used) VALUES (?,?,?,?,?,1)').run(id,input.project_id,input.actor,'{}',expires);
    });
    const stop=this.begin(id);
    try{
      await this.store.setDomain(input.project_id,input.domain,id);
      const ctx=await this.context(input,id),origin=await this.origin(ctx.view);
      if(input.intent==='create'&&ctx.remote)throw Error('官网仓库已存在，请使用拉取/绑定');
      let kind:Plan['kind']=input.intent==='deploy'?'publish':input.intent;
      if(!ctx.remote)kind='create';
      else {
        const row=this.store.database.sql.prepare('SELECT value FROM settings WHERE key=?').get('gitlab-binding:'+input.project_id) as any;
        const binding=row?JSON.parse(row.value):null;
        if(input.intent==='bind'||origin!==ctx.url||binding?.repository_id!==ctx.remote.id||binding?.repository!==ctx.url)kind='bind';
      }
      if(input.intent==='deploy'||input.intent==='push')await this.ready(ctx.view);
      const force_overwrite=kind!=='create'?await this.hasConflict(ctx):false;
      const matrix=await this.git.statusMatrix(this.options(ctx.view));
      const snapshot=await this.snapshot(ctx.view);
      const plan:Plan={...input,id,kind,force_overwrite,config:settingsDigest(ctx.c),...snapshot,local:ctx.local,remote:ctx.branch?.commit.id||null,deploy:ctx.deployBranch.commit.id,repository:ctx.url,deploy_repository:gitlabHost(ctx.c.GITLAB_HOST)+'/'+gitlabPath(ctx.c.GITLAB_WEBSITE_DEPLOY_DIR,gitlabHost(ctx.c.GITLAB_HOST)),deploy_branch:ctx.c.GITLAB_DEFAULT_BRANCH,gitlab_user:ctx.user.username,uncommitted:matrix.some(([,head,work,stage]:[string,number,number,number])=>head!==work||head!==stage),choices:['confirm'],checks:ctx.checks,expires_at:expires};
      assertEditable(this.store.database,input.project_id,id);
      this.checkpoint(id);
      this.store.database.sql.prepare('UPDATE deployment_requests SET data=?,used=0 WHERE id=? AND used=1').run(JSON.stringify(plan),id);
      this.stage(input.project_id,id,'等待用户确认');return {status:'confirmation_required',challenge:plan};
    }catch(error){this.release(input.project_id,id);if(this.cancelled(id))return {status:'cancelled',message:'发布任务已取消，未创建发布标签'};const token=(await this.settings.get()).GITLAB_TOKEN;throw Error((error as Error).message.replaceAll(token||'\u0000','[REDACTED]'));}finally{stop();}
  }
  private async bind(view:ProjectView,url:string){await this.git.addRemote({...this.options(view),remote:'origin',url,force:true});}
  private async cloud(ctx:Awaited<ReturnType<GitLabWorkflow['context']>>,owner:string){
    const metadata=await realpath(ctx.view.metadataDirectory),state=await realpath(this.store.stateRoot);
    const inside=(root:string,target:string)=>{const rel=relative(root,target);if(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel))throw Error('备份路径越界');};
    inside(state,metadata);await mkdir(join(metadata,'gitlab-backups'),{recursive:true});
    const parent=await realpath(join(metadata,'gitlab-backups'));inside(metadata,parent);
    const backup=join(parent,randomUUID()),stage=join(backup,'cloud');await mkdir(backup,{recursive:true});
    await this.git.clone({fs,dir:stage.replaceAll('\\','/'),http:this.io.http(ctx.c,this.signal(ctx.c)),url:ctx.url,ref:'main',singleBranch:true,onAuth:()=>({username:'oauth2',password:ctx.c.GITLAB_TOKEN})});
    this.checkpoint(owner);
    if(!(await lstat(join(stage,'src'))).isDirectory()||!(await lstat(join(stage,'README.md'))).isFile())throw Error('云端不是当前src/README项目格式，不覆盖本地');
    await mkdir(join(stage,'material'),{recursive:true});await mkdir(join(stage,'src/images'),{recursive:true});await assertMainRepository(stage);
    const pages:{path:string;title:string;status:'ready';version:number}[]=[];
    const walk=async(folder:string):Promise<void>=>{for(const entry of await readdir(folder,{withFileTypes:true})){const file=join(folder,entry.name);if(entry.isDirectory())await walk(file);else if(/\.html?$/i.test(entry.name)){const html=await readFile(file,'utf8');if(!/<\/html>\s*$/i.test(html))throw Error('云端页面不完整');pages.push({path:relative(join(stage,'src'),file).split(sep).join('/'),title:html.match(/<title[^>]*>(.*?)<\/title>/is)?.[1]||entry.name,status:'ready',version:1});}}};await walk(join(stage,'src'));if(!pages.length)throw Error('云端没有可用页面，不覆盖本地');
    const backupSource=join(backup,'local');
    for(const path of [stage,backupSource])inside(metadata,path);
    assertEditable(this.store.database,ctx.view.project.id,owner);
    await writeFile(join(backup,'project.json'),JSON.stringify(ctx.view.project,null,2));
    this.checkpoint(owner);await rename(ctx.view.projectDirectory,backupSource);
    try{await rename(stage,ctx.view.projectDirectory);}catch(error){await rename(backupSource,ctx.view.projectDirectory);throw error;}
    const project={...ctx.view.project,pages,hasPreview:true,hasPublished:true,revision:randomUUID(),updatedAt:new Date().toISOString()};
    try{
      this.store.database.save(project);await writeFile(join(ctx.view.metadataDirectory,'project.json'),JSON.stringify(project,null,2));
      this.store.database.sql.prepare('DELETE FROM resources WHERE project_id=?').run(project.id);this.store.database.sql.prepare('DELETE FROM image_tasks WHERE project_id=?').run(project.id);
    }catch(error){await rename(ctx.view.projectDirectory,join(backup,'failed-cloud'));await rename(backupSource,ctx.view.projectDirectory);this.store.database.save(ctx.view.project);await writeFile(join(ctx.view.metadataDirectory,'project.json'),JSON.stringify(ctx.view.project,null,2));throw error;}
    return backup;
  }
  async execute(id:string,actor:string,decision:string,expectedIntent?:GitLabIntent,expectedProject?:string){
    const row=this.store.database.sql.prepare('SELECT * FROM deployment_requests WHERE id=?').get(id) as any;
    if(!row||row.thread_id!==actor||row.used||row.expires_at<Date.now()||expectedProject&&row.project_id!==expectedProject)throw Error('确认请求无效、过期或已经使用，请重新检查');
    const plan=JSON.parse(row.data) as Plan;if(expectedIntent&&plan.intent!==expectedIntent)throw Error('确认请求与当前操作不匹配');if(!plan.kind||!plan.choices.includes(decision))throw Error('必须选择当前确认窗口提供的选项');
    assertEditable(this.store.database,plan.project_id,id);
    if(!this.store.database.sql.prepare('UPDATE deployment_requests SET used=1 WHERE id=? AND used=0').run(id).changes)throw Error('确认已使用');
    const stop=this.begin(id);
    try{
      const ctx=await this.context(plan,id),snapshot=await this.snapshot(ctx.view);
      if(settingsDigest(ctx.c)!==plan.config||snapshot.files!==plan.files||snapshot.index!==plan.index||ctx.local!==plan.local||(ctx.branch?.commit.id||null)!==plan.remote||ctx.deployBranch.commit.id!==plan.deploy||ctx.url!==plan.repository)throw Error('配置、本地或云端版本已经变化，必须重新检查并确认');
      this.checkpoint(id);
      let result:any;
      if(plan.kind==='create'){
        if(ctx.remote)throw Error('仓库已被创建，必须重新检查');this.stage(plan.project_id,id,'创建官网仓库');
        const created=await this.api(ctx.c,'POST','/projects',{name:plan.domain,path:plan.domain,namespace_id:ctx.group.id,visibility:'private',initialize_with_readme:false});
        if(!Number.isInteger(created.id)||created.empty_repo!==true||created.path_with_namespace!==ctx.group.full_path+'/'+plan.domain||created.http_url_to_repo!==ctx.url)throw Error('创建结果与确认的空官网仓库不一致，请人工核对');
        this.checkpoint(id);await this.bind(ctx.view,ctx.url);result={status:'created',repository:ctx.url,repository_id:created.id};
      }else if(plan.kind==='bind'){
        this.stage(plan.project_id,id,'以本地为准绑定仓库');
        this.checkpoint(id);await this.bind(ctx.view,ctx.url);result={status:'bound',strategy:'local',repository:ctx.url,repository_id:ctx.remote.id};
      }else{
        if(!ctx.remote||await this.origin(ctx.view)!==ctx.url)throw Error('官网仓库尚未正确绑定');
        if(plan.intent==='deploy'||plan.kind==='push')await this.ready(ctx.view);
        if(!plan.force_overwrite&&await this.hasConflict(ctx))throw Error('GIT_CONFIRMATION_REQUIRED：云端版本发生变化，请重新检查并确认强制覆盖');
        this.stage(plan.project_id,id,'提交本地版本');
        const commit=await commitProject(ctx.view.projectDirectory,'Update website for '+plan.domain,{name:ctx.user.name||ctx.user.username,email:ctx.user.email||`${ctx.user.username}@localhost`});
        this.checkpoint(id);
        let local=await this.git.resolveRef({...this.options(ctx.view),ref:'refs/heads/main'});
        if(plan.kind==='commit')result={status:'committed',git:commit};
        else{
          await this.trackedSource(ctx.view);
          if(await fileFingerprint(ctx.view.projectDirectory)!==plan.files)throw Error('发布期间项目文件发生变化，已停止');
          this.stage(plan.project_id,id,'核对并推送官网main');
          const fresh=await this.api(ctx.c,'GET',`/projects/${ctx.remote.id}/repository/branches/main`,undefined,true);
          if((fresh?.commit?.id||null)!==plan.remote)throw Error('GIT_CONFIRMATION_REQUIRED：云端版本发生变化，请先确认并使用系统Git处理');
          if(plan.force_overwrite&&plan.remote&&fresh?.commit?.id&&fresh.commit.id!==local){
            await this.git.fetch({...this.options(ctx.view),http:this.io.http(ctx.c,this.signal(ctx.c)),url:ctx.url,remote:'origin',ref:'main',singleBranch:true,onAuth:()=>({username:'oauth2',password:ctx.c.GITLAB_TOKEN})});
            const {commit:localCommit}=await this.git.readCommit({...this.options(ctx.view),oid:local});
            const now=Math.floor(Date.now()/1000),tz=new Date().getTimezoneOffset();
            const author={name:ctx.user.name||ctx.user.username,email:ctx.user.email||`${ctx.user.username}@localhost`,timestamp:now,timezoneOffset:tz};
            const overwriteOid=await this.git.writeCommit({...this.options(ctx.view),commit:{tree:localCommit.tree,parent:[plan.remote,local],author,committer:author,message:`Overwrite remote with local website for ${plan.domain}\n`}});
            await this.git.writeRef({...this.options(ctx.view),ref:'refs/heads/main',value:overwriteOid,force:true});
            local=overwriteOid;
          }
          if(fresh?.commit?.id!==local)try{await this.git.push({...this.options(ctx.view),http:this.io.http(ctx.c,this.signal(ctx.c)),url:ctx.url,remote:'origin',ref:'main',remoteRef:'main',force:false,onAuth:()=>({username:'oauth2',password:ctx.c.GITLAB_TOKEN})});}catch(error){if(/non.?fast.?forward|push.?rejected|conflict|diverg/i.test((error as Error).message+' '+(error as any).code))throw Error('GIT_CONFIRMATION_REQUIRED：云端拒绝非快进推送，请重新检查并确认覆盖');if(/pre-receive hook declined/i.test((error as Error).message))throw Error('GitLab 服务端拒绝推送（pre-receive hook declined），请检查分支保护或推送权限');throw error;}
          const verified=await this.api(ctx.c,'GET',`/projects/${ctx.remote.id}/repository/branches/main`);
          if(verified.commit?.id!==local)throw Error('推送后云端版本与本地不一致，未发布');
          result={status:'pushed',oid:local,repository:ctx.url};
          if(plan.kind==='publish'){
            this.stage(plan.project_id,id,'最终发布核验');
            const target=await this.api(ctx.c,'GET',`/projects/${ctx.deployment.id}/repository/branches/${encodeURIComponent(ctx.c.GITLAB_DEFAULT_BRANCH)}`);
            if(target.commit?.id!==plan.deploy||await fileFingerprint(ctx.view.projectDirectory)!==plan.files)throw Error('发布基准或本地文件变化，请重新确认');
            const tag=releaseName(plan.environment!,this.now()),path=`/projects/${ctx.deployment.id}/repository/tags`;
            if(await this.api(ctx.c,'GET',path+'/'+encodeURIComponent(tag),undefined,true))throw Error('该分钟的发布标签已存在，不覆盖、不复用；请下一分钟重新确认');
            assertEditable(this.store.database,plan.project_id,id);
            const source=await this.api(ctx.c,'GET',`/projects/${ctx.remote.id}/repository/branches/main`);if(source.commit?.id!==local)throw Error('官网云端版本再次变化，未发布');
            await assertMainRepository(ctx.view.projectDirectory);
            if(await this.git.resolveRef({...this.options(ctx.view),ref:'refs/heads/main'})!==local||await this.origin(ctx.view)!==ctx.url||settingsDigest(await this.settings.get())!==plan.config)throw Error('本地Git或配置在发布期间变化，未发布');
            const matrix=await this.git.statusMatrix(this.options(ctx.view));
            if(matrix.some(([,head,work,stage]:[string,number,number,number])=>head!==work||head!==stage))throw Error('发布期间产生了未提交或暂存修改，未发布');
            let tagged;
            this.checkpoint(id);
            if(!this.store.database.sql.prepare('UPDATE deployment_requests SET used=3 WHERE id=? AND used=1').run(id).changes)throw Error('DEPLOYMENT_CANCELLED：发布任务已取消');
            this.stage(plan.project_id,id,'创建发布标签（不可取消）');
            try{tagged=await this.api(ctx.c,'POST',path,{tag_name:tag,ref:target.commit.id,message:plan.domain});}
            catch(error){throw Error(`发布标签 ${tag} 的请求未能确认，请先人工核对远端标签，不自动重复发布。${(error as Error).message}`);}
            if(tagged.name!==tag||tagged.message?.trim()!==plan.domain||tagged.commit?.id!==target.commit.id)throw Error('发布API结果不符合确认内容；请人工核对标签，不能自动重复发布');
            result={status:'deployment_triggered',tag,domain:plan.domain,environment:plan.environment,website_oid:local,deploy_oid:target.commit.id,repository:ctx.url,message:'发布标签已创建；网站上线结果由GitLab部署流水线决定'};
            this.save(plan.project_id,result);
          }
        }
      }
      if(['create','bind'].includes(plan.kind)){
        this.save(plan.project_id,{...result,domain:plan.domain});
        this.store.database.sql.prepare('INSERT INTO settings VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('gitlab-binding:'+plan.project_id,JSON.stringify({repository:ctx.url,repository_id:result.repository_id,domain:plan.domain}));
      }
      this.checkpoint(id);
      if(['create','bind'].includes(plan.kind)&&plan.intent==='deploy')return await this.prepare({project_id:plan.project_id,actor,intent:'deploy',domain:plan.domain,environment:plan.environment},id);
      this.release(plan.project_id,id);
      return result;
    }catch(error){
      if(this.cancelled(id)){const result={status:'cancelled',message:'发布任务已取消，已完成的提交或同步予以保留，未创建发布标签'};this.save(plan.project_id,result);return result;}
      const token=(await this.settings.get()).GITLAB_TOKEN;
      const message=(error as Error).message.replaceAll(token||'\u0000','[REDACTED]');this.save(plan.project_id,{status:'failed',message});throw Error(message);
    }finally{stop();this.release(plan.project_id,id);}
  }
}
