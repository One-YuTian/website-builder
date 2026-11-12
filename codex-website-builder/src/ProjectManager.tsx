import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { WebsiteCanvas } from './WebsiteCanvas';
import { manageProjects } from './project-api';
import { hostApp, hostReady } from './bridge';
import { Icon } from './Icons';

type Project = {id:string;name:string;updatedAt:string;thumbnail?:string};
type Detail = {project_id:string;thread_id:string|null;name:string;directory:string};
export function ProjectManager({background}:{background:ReactNode}) {
  const [panelId]=useState(()=>crypto.randomUUID());
  const [projects,setProjects]=useState<Project[]>([]);
  const [detail,setDetail]=useState<Detail|null>(null);
  const [query,setQuery]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [deleted,setDeleted]=useState<string|null>(null);
  const thread=useRef<string|undefined>(undefined);
  const current=useRef<Detail|null>(null);current.current=detail;
  const request=useCallback((input:Record<string,unknown>)=>manageProjects({panel_id:panelId,thread_id:thread.current,...input}),[panelId]);
  const publish=useCallback(async(value:any)=>{
    if(hostApp){await hostReady;await hostApp.updateModelContext({structuredContent:{panel_id:panelId,...value}});}
  },[panelId]);
  const refresh=useCallback(async()=>{
    const value=await request({action:'list'});thread.current=value.thread_id||undefined;setProjects(value.projects);
    if(current.current&&value.thread_id&&current.current.thread_id!==value.thread_id)setDetail({...current.current,thread_id:value.thread_id});
    if(current.current&&!value.projects.some((project:Project)=>project.id===current.current?.project_id)) {setDetail(null);await request({action:'home'});await publish({page:'home'});}
    return value;
  },[request,publish]);
  useEffect(()=>{
    let stopped=false;
    const start=async()=>{try{await refresh();if(!stopped){await request({action:'home'});await publish({page:'home'});}}catch(error){if(!stopped)setError((error as Error).message);}};
    void start();const timer=setInterval(()=>void refresh().catch(error=>setError((error as Error).message)),5000);
    return()=>{stopped=true;clearInterval(timer);};
  },[refresh,request,publish]);
  const home=async()=>{try{await request({action:'home'});setDetail(null);setError('');await refresh();await publish({page:'home'});}catch(error){setError((error as Error).message);}};
  const open=async(id:string)=>{setBusy(true);try{const value=await request({action:'open',project_id:id});setDetail(value);setError('');await publish(value);}catch(error){setError((error as Error).message);}finally{setBusy(false);}};
  const remove=async(id:string)=>{setBusy(true);try{await request({action:'delete',project_id:id});setDeleted(id);if(detail?.project_id===id)setDetail(null);await refresh();setError('');}catch(error){setError((error as Error).message);}finally{setBusy(false);}};
  const groups=new Map<string,Project[]>();
  for(const project of projects.filter(project=>project.name.toLowerCase().includes(query.toLowerCase()))) {
    const age=Date.now()-Date.parse(project.updatedAt),year=new Date(project.updatedAt).getFullYear();
    const label=age<7*86400000?'最近 7 天':year===new Date().getFullYear()?'今年':String(year);
    groups.set(label,[...(groups.get(label)||[]),project]);
  }
  return <div className={`project-manager ${detail?'is-detail':''}`}>
    {deleted&&<div className="manager-error" role="status">项目已删除<button onClick={()=>void request({action:'restore',project_id:deleted}).then(()=>{setDeleted(null);return refresh();}).catch(error=>setError(error.message))}>撤销</button><button aria-label="关闭删除提示" onClick={()=>setDeleted(null)}>×</button></div>}
    {error&&<div className="manager-error" role="alert">{error}<button aria-label="关闭错误" onClick={()=>setError('')}>×</button></div>}
    {detail?<WebsiteCanvas key={detail.project_id} background={background} projectId={detail.project_id} threadId={detail.thread_id||undefined} onHome={()=>void home()} onProject={id=>void open(id)} onFolder={()=>void request({action:'folder',project_id:detail.project_id}).catch(error=>setError(error.message))}/>:<div className="project-home">
      <aside className="project-sidebar" aria-label="项目目录">
        <h1>Website Builder</h1>
        <label className="project-search"><Icon name="search"/><input aria-label="搜索项目" placeholder="搜索项目" value={query} onChange={event=>setQuery(event.target.value)}/></label>
        <div className="project-groups">{[...groups].map(([label,items])=><section key={label}><h2>{label}</h2>{items.map(project=><div className="project-row" data-project-id={project.id} key={project.id}>
          <button className="project-open" onClick={()=>void open(project.id)} disabled={busy}><span className="project-thumbnail">{project.thumbnail?<img src={project.thumbnail} alt=""/>:<Icon name="pages"/>}</span><span className="project-description"><strong>{project.name}</strong><time dateTime={project.updatedAt}>{new Date(project.updatedAt).toLocaleDateString()}</time></span></button>
          <button className="project-delete" aria-label={`删除项目 ${project.name}`} title="删除项目" disabled={busy} onClick={()=>void remove(project.id)}><Icon name="trash"/></button>
        </div>)}</section>)}{!projects.length&&<p className="projects-empty">暂无项目</p>}{projects.length>0&&!groups.size&&<p className="projects-empty">没有匹配的项目</p>}</div>
      </aside>
      <section className="project-compose" aria-label="项目需求输入">{background}<div className="project-compose-inner"><h2>开始构建你的网站</h2><Prompt/></div></section>
    </div>}
  </div>;
}
function Prompt() {
  return <div className="project-prompt" aria-label="网站生成功能开发中"><textarea aria-label="项目需求" placeholder="开发中" disabled/><button type="button" aria-label="发送（开发中）" title="开发中" disabled><Icon name="send"/></button></div>;
}
