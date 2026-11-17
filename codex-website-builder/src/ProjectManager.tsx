import { ProjectPrompt, type PromptContent, type CreatedProject } from './ProjectPrompt';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { WebsiteCanvas } from './WebsiteCanvas';
import { manageProjects } from './project-api';
import { hostApp, hostReady, getLaunchThread } from './bridge';
import { Icon } from './Icons';
import {openPluginModal} from './plugin-modal';

import { projectTime, statusLabels, type ProjectStatus } from '../server/project-presentation';
type Project = {id:string;name:string;brand?:string;displayName?:string;country?:string;language?:string;categories?:string[];deploying?:boolean;status?:ProjectStatus;deletable?:boolean;updatedAt:string;thumbnail?:string};
type Detail = {project_id:string;thread_id:string|null;name:string;directory:string};
export function ProjectManager({background}:{background:ReactNode}) {
  useEffect(()=>{
    const block=(event:Event)=>{if(event.target instanceof Element&&event.target.closest('textarea,input'))return;event.preventDefault();event.stopImmediatePropagation();};
    document.addEventListener('selectstart',block,true);document.addEventListener('contextmenu',block,true);
    return()=>{document.removeEventListener('selectstart',block,true);document.removeEventListener('contextmenu',block,true);};
  },[]);
  const activeSubmission=useRef<string|null>(null);
  const detailSubmission=useRef<{request_id:string;panel_id:string}|null>(null);
  const [panelId,setPanelId]=useState(()=>crypto.randomUUID());
  const activePanel=useRef(panelId);activePanel.current=panelId;
  const [projects,setProjects]=useState<Project[]>([]);
  const [detail,setDetail]=useState<Detail|null>(null);

  const [openingSettings,setOpeningSettings]=useState(false);
  const [query,setQuery]=useState('');
  const [error,setError]=useState('');
  useEffect(()=>{if(!detail||!error)return;const timer=setTimeout(()=>setError(''),3000);return()=>clearTimeout(timer);},[detail?.project_id,error]);
  const [busy,setBusy]=useState(false);
  const [deleted,setDeleted]=useState<string|null>(null);
  const thread=useRef<string|undefined>(undefined);
  const navigation=useRef(0);
  const current=useRef<Detail|null>(null);current.current=detail;
  const request=useCallback((input:Record<string,unknown>)=>manageProjects({panel_id:panelId,thread_id:thread.current,...input}),[panelId]);
  useEffect(()=>{
    if(!detail||!detailSubmission.current)return;
    const submission=detailSubmission.current;
    let stopped=false;
    const acknowledge=()=>{if(detailSubmission.current!==submission)return;void request({action:'submission',panel_id:submission.panel_id,request_id:submission.request_id,visible_panel_id:panelId,detail_ready:true}).then(()=>{if(detailSubmission.current===submission)detailSubmission.current=null;}).catch(error=>{if(!stopped)setError(error.message);});};
    acknowledge();const timer=setInterval(acknowledge,2000);
    return()=>{stopped=true;clearInterval(timer);};
  },[detail?.project_id,request]);
  const publish=useCallback(async(value:any)=>{
    if(hostApp&&!activeSubmission.current){await hostReady;await hostApp.updateModelContext({structuredContent:{panel_id:panelId,...value}});}
  },[panelId]);
  const refresh=useCallback(async()=>{
    const value=await request({action:'list'});if(activePanel.current!==panelId)return value;thread.current=value.thread_id||undefined;setProjects(value.projects);
    if(current.current&&value.thread_id&&current.current.thread_id!==value.thread_id)setDetail({...current.current,thread_id:value.thread_id});
    if(current.current&&!value.projects.some((project:Project)=>project.id===current.current?.project_id)) {setDetail(null);await request({action:'home'});await publish({page:'home'});}
    return value;
  },[request,publish,panelId]);
  useEffect(()=>{
    let stopped=false;
    const start=async()=>{const revision=++navigation.current;try{
      const launched=getLaunchThread();if(launched)thread.current=launched;
      const value=await request({action:'resume'});
      if(stopped||revision!==navigation.current)return;
      if(value.page==='project'){thread.current=value.thread_id||undefined;detailSubmission.current=value.submission||null;current.current=value;setDetail(value);}
      else {current.current=null;setDetail(null);}
      await refresh();if(!stopped&&revision===navigation.current)await publish(value);
    }catch(error){if(!stopped&&revision===navigation.current)setError((error as Error).message);}};
    // A reopened chat entry must not inherit an earlier launch's panel/thread affinity.
    // Finish an in-flight send before attaching a reused view to the new chat.
    let launchTimer:ReturnType<typeof setTimeout>|undefined;
    const launched=()=>{clearTimeout(launchTimer);if(activeSubmission.current){launchTimer=setTimeout(launched,100);return;}detailSubmission.current=null;setPanelId(crypto.randomUUID());};window.addEventListener('website-builder:launch',launched);
    void start();const timer=setInterval(()=>void refresh().catch(error=>setError((error as Error).message)),5000);
    return()=>{stopped=true;navigation.current++;clearInterval(timer);clearTimeout(launchTimer);window.removeEventListener('website-builder:launch',launched);};
  },[refresh,request,publish]);
  const home=async()=>{navigation.current++;try{await request({action:'home'});current.current=null;setDetail(null);setError('');await refresh();await publish({page:'home'});}catch(error){setError((error as Error).message);}};
  const open=async(id:string)=>{navigation.current++;setBusy(true);try{const value=await request({action:'open',project_id:id});current.current=value;setDetail(value);setError('');await publish(value);}catch(error){setError((error as Error).message);}finally{setBusy(false);}};
  const remove=async(id:string)=>{setBusy(true);try{await request({action:'delete',project_id:id});setDeleted(id);if(detail?.project_id===id)setDetail(null);await refresh();setError('');}catch(error){setError((error as Error).message);}finally{setBusy(false);}};
  const sendPrompt=async(text:string,content:PromptContent,signal:AbortSignal):Promise<CreatedProject>=>{
    if(!hostApp)throw Error('请在 Codex 插件面板中发送需求。');
    await hostReady;
    const requestId=crypto.randomUUID();
    await request({action:'submission',submission_start:true,request_id:requestId,requirement:text.trim()||'请根据附件创建网站。'});
    activeSubmission.current=requestId;setBusy(true);
    try{
      await hostApp.updateModelContext({structuredContent:{panel_id:panelId,page:'home',submission:{request_id:requestId,action:'create',panel_id:panelId,instructions:'用户从首页提交了新建网站需求。必须使用 website-builder SKILL，先调用 website_projects(action=create, panel_id=此panel_id, request_id=此request_id, thread_id=当前真实会话ID)，提供国家/语言/主要类目/品牌等元数据。先创建空项目，再立即调用open_thread_canvas(thread_id=当前新对话真实ID)一次，在新对话打开侧边UI并进入详情，不新建重复项目。查询website_projects(action=submission,panel_id,request_id)直到chat_detail_ready=true，再沿用project_id规划页面、导入商品和生成内容，不能复用旧项目；附件随用户消息提供。'}}});
      const message={role:'user' as const,content,_meta:{'openai/message':{target:'new',send:true}}};
      const result=await hostApp.sendMessage(message,{timeout:60000});
      if(result.isError)throw Error('新对话未接受消息，请重试。草稿已保留。');
      while(!signal.aborted){
        const value=await request({action:'submission',request_id:requestId});
          if(value.state==='created'){thread.current=value.project.thread_id||undefined;detailSubmission.current={request_id:requestId,panel_id:panelId};return value.project;}
        if(!['pending','creating'].includes(value.state))throw Error(value.error||'创建请求已取消或失效。');
        await new Promise<void>(resolve=>{const done=()=>{clearTimeout(timer);signal.removeEventListener('abort',done);resolve();};const timer=setTimeout(done,1000);signal.addEventListener('abort',done,{once:true});});
      }
      throw Error('已离开输入界面');
    }catch(error){if(!signal.aborted)await request({action:'submission',request_id:requestId,cancel:true}).catch(()=>{});throw error;}
    finally{activeSubmission.current=null;setBusy(false);}
  };
  const created=(value:CreatedProject)=>{thread.current=value.thread_id||undefined;current.current=value;setDetail(value);setError('');void publish(value).catch(error=>setError(error.message));};
  const groups=new Map<string,Project[]>();
  for(const project of projects.filter(project=>`${project.displayName||''} ${project.brand||''} ${project.name} ${(project.categories||[]).join(' ')}`.toLowerCase().includes(query.toLowerCase()))) {
    const age=Date.now()-Date.parse(project.updatedAt),year=new Date(project.updatedAt).getFullYear();
    const label=age<7*86400000?'最近 7 天':year===new Date().getFullYear()?'今年':String(year);
    groups.set(label,[...(groups.get(label)||[]),project]);
  }
  return <div className={`project-manager ${detail?'is-detail':''}`}>

    {deleted&&<div className="manager-error" role="status">项目已删除<button onClick={()=>void request({action:'restore',project_id:deleted}).then(()=>{setDeleted(null);return refresh();}).catch(error=>setError(error.message))}>撤销</button><button aria-label="关闭删除提示" onClick={()=>setDeleted(null)}>×</button></div>}
    {error&&<div className="manager-error" role="alert">{error}<button aria-label="关闭错误" onClick={()=>setError('')}>×</button></div>}
    {detail?<WebsiteCanvas key={detail.project_id} background={background} projectId={detail.project_id} panelId={panelId} threadId={detail.thread_id||undefined} onHome={()=>void home()} onProject={id=>void open(id)} onFolder={()=>void request({action:'folder',project_id:detail.project_id}).catch(error=>setError(error.message))}/>:<div className="project-home">{background}
      <aside className="project-sidebar" aria-label="项目目录">
        <label className="project-search"><Icon name="search"/><input aria-label="搜索项目" placeholder="搜索项目" value={query} onChange={event=>setQuery(event.target.value)}/></label>
        <div className="project-groups">{[...groups].map(([label,items])=><section key={label}><h2>{label}</h2>{items.map(project=><div className="project-row" data-project-id={project.id} key={project.id}>
          <button className="project-open" onClick={()=>void open(project.id)} disabled={busy}><span className="project-thumbnail">{project.thumbnail?<img src={project.thumbnail} alt=""/>:<Icon name="pages"/>}</span><span className="project-description"><strong title={project.displayName||`网站-${project.name}`}>{project.displayName||`网站-${project.name}`}</strong><time dateTime={project.updatedAt} title={projectTime(project.updatedAt)}>{projectTime(project.updatedAt)}</time></span></button>
          <div className="project-actions">{project.deletable===false?<span className="project-running" role="status" aria-label={project.deploying?'部署中':statusLabels[project.status||'generating']}><span className="project-status-spinner" aria-hidden="true"/></span>:<>{project.status==='failed'&&<span className="project-status failed" role="status" aria-label={statusLabels.failed}>{statusLabels.failed}</span>}<button className="project-delete" aria-label={`删除项目 ${project.name}`} title="删除项目" disabled={busy} onClick={()=>void remove(project.id)}><Icon name="trash"/></button></>}</div>
        </div>)}</section>)}{!projects.length&&<p className="projects-empty">暂无项目</p>}{projects.length>0&&!groups.size&&<p className="projects-empty">没有匹配的项目</p>}</div>
      </aside>
      <section className="project-compose" aria-label="项目需求输入"><div className="project-compose-inner"><div className="project-compose-heading"><h2>开始构建你的网站</h2>{/* GitLab 配置入口暂时注释保留：<button className="plugin-settings-button" aria-label="插件配置" title="插件配置" aria-haspopup="dialog" disabled={openingSettings} onClick={()=>{if(openingSettings)return;setOpeningSettings(true);void openPluginModal('settings',{},true).catch(error=>setError(error.message)).finally(()=>setOpeningSettings(false));}}><Icon name="settings"/></button> */}</div><ProjectPrompt send={sendPrompt} onCreated={created}/></div></section>
    </div>}
  </div>;
}
