import {useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';

import {pluginControl} from './plugin-control';
import {openPluginModal,closePluginModal} from './plugin-modal';
import {Icon} from './Icons';
import {hostApp} from './bridge';


const deployTimelineSteps=[
 {id:'check',label:'检查连接与版本'},
 {id:'confirm',label:'确认发布方案'},
 {id:'sync',label:'同步代码与仓库'},
 {id:'verify',label:'最终核验'},
 {id:'deploy',label:'部署（添加 Tag / Push）'},
] as const;

function resolveTimelineIndex(stage:string,challenge:any,result:any,busy:boolean){
 if(result?.status==='deployment_triggered')return 5;
 if(stage.includes('创建发布标签'))return 4;
 if(stage.includes('最终发布核验'))return 3;
 if(stage.includes('创建官网仓库')||stage.includes('备份本地')||stage.includes('保留本地')||stage.includes('提交本地版本')||stage.includes('核对并推送'))return 2;
 if(challenge||stage.includes('等待用户确认'))return 1;
 if(busy||stage.includes('检查中'))return 0;
 return -1;
}

function ProjectIdChip({projectId}:{projectId:string}){
  const [copied,setCopied]=useState(false);
  useEffect(()=>{if(!copied)return;const timer=setTimeout(()=>setCopied(false),1800);return()=>clearTimeout(timer);},[copied]);
  const copyId=async()=>{try{await navigator.clipboard.writeText(projectId);setCopied(true);}catch{}};
  return <span className="deploy-id-chip"><span>ID: {projectId}</span><button type="button" className={copied?'deploy-id-copy is-copied':'deploy-id-copy'} aria-label={copied?'已复制项目ID':'复制项目ID'} title={copied?'已复制':'复制项目ID'} onClick={()=>void copyId()}><Icon name="copy"/></button></span>;
}

export function DeploymentPanel({projectId,panelId,threadId,onClose,inline,onBack}:{projectId:string;panelId:string;threadId?:string;onClose?:()=>void;inline?:boolean;onBack?:()=>void}){
  const envStorageKey=`website-builder:deploy-env:${projectId}`;
  const envTouched=useRef(false);
  const domainTouched=useRef(false);
  const savedDomain=useRef('');
  const [open,setOpen]=useState(true),[domain,setDomain]=useState(''),[environment,setEnvironment]=useState<string>(()=>{try{const saved=localStorage.getItem(envStorageKey);if(saved==='test'||saved==='production')return saved;}catch{}return 'test';}),[status,setStatus]=useState<any>({}),[result,setResult]=useState<any>(null),[challenge,setChallenge]=useState<any>(null),[decision,setDecision]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const request=useCallback((action:string,values:Record<string,unknown>={})=>pluginControl({type:'deploy',action,project_id:projectId,panel_id:panelId,thread_id:threadId,...values}),[projectId,panelId,threadId]);
  useEffect(()=>{if(!hostApp)return;hostApp.onteardown=async()=>{try{const value=await request('status');if(value.locked&&value.cancellable)await request('cancel');}catch{/* The backend retains the lease until any in-flight work settles. */}return {};};return()=>{if(hostApp)hostApp.onteardown=undefined;};},[request]);
  useEffect(()=>{let stopped=false,inflight=false;const poll=async()=>{if(inflight)return;inflight=true;try{const value=await request('status');if(!stopped){setStatus(value);if(value.domain){savedDomain.current=value.domain;if(!domainTouched.current)setDomain(previous=>previous||value.domain);}if(!envTouched.current&&value.last?.environment&&['test','production'].includes(value.last.environment)){try{if(!localStorage.getItem(envStorageKey))setEnvironment(value.last.environment);}catch{setEnvironment(value.last.environment);}}}}catch{/* A transient status failure must not unlock an active deployment. */}finally{inflight=false;}};void poll();const timer=setInterval(()=>void poll(),1000);return()=>{stopped=true;clearInterval(timer);};},[request,envStorageKey]);

  const persistDomain=async(value:string)=>{const trimmed=value.trim().toLowerCase();if(trimmed===savedDomain.current)return;try{const res=await request('domain',{domain:trimmed});savedDomain.current=res.domain||'';}catch{}};

  const selectEnvironment=(value:'test'|'production')=>{envTouched.current=true;setEnvironment(value);try{localStorage.setItem(envStorageKey,value);}catch{}};
  const accept=(value:any)=>{if(value.status==='confirmation_required'){setChallenge(value.challenge);setDecision(value.challenge.choices.length===1?'confirm':'');setResult(null);}else{setResult(value);setChallenge(null);}};
  const prepare=async()=>{setBusy(true);setError('');try{accept(await request('prepare',{domain,environment}));}catch(error){setError((error as Error).message);}finally{setBusy(false);setStatus(await request('status').catch(()=>({locked:true,stage:'状态未知，请重开确认窗口'})));}};
  const execute=async()=>{setBusy(true);setError('');try{accept(await request('execute',{confirmation_id:challenge.id,decision}));}catch(error){setChallenge(null);setError((error as Error).message);}finally{setBusy(false);setStatus(await request('status').catch(()=>({locked:true,stage:'状态未知'})));}};
  const close=async()=>{try{if(status.locked||busy||challenge){const value=await request('cancel',{confirmation_id:challenge?.id});if(value.status==='cancelling'){setStatus(await request('status'));return;}}setChallenge(null);setResult(null);setError('');if(!inline)setOpen(false);if(onClose)onClose();else await closePluginModal();}catch(error){setError((error as Error).message);}};
  const backOrCancel=async()=>{try{if(status.locked||busy||challenge){await request('cancel',{confirmation_id:challenge?.id});}setChallenge(null);setResult(null);setError('');if(inline&&onBack)onBack();else if(onClose)onClose();}catch(error){setError((error as Error).message);}};
  const label=challenge?.kind==='create'?'创建官网仓库':challenge?.kind==='bind'?'拉取 / 绑定官网仓库':challenge?'确认发布':'部署到线上环境';
  const timelineIndex=resolveTimelineIndex(String(status.stage||''),challenge,result,busy);
  const showTimeline=timelineIndex>=0&&(busy||status.locked||challenge||result?.status==='deployment_triggered');
  const canCancel=!(status.locked&&status.cancellable===false);
  const content=<>
    {showTimeline&&<ol className="deploy-timeline" aria-label="发布时间轴">
      {deployTimelineSteps.map((step,index)=>{
        const state=timelineIndex>index?'done':timelineIndex===index?'active':'pending';
        return <li key={step.id} className={`deploy-timeline-item is-${state}`} data-state={state}><span className="deploy-timeline-dot" aria-hidden="true"/><span className="deploy-timeline-label">{step.label}</span>{state==='active'&&status.stage?<small className="deploy-timeline-stage">{status.stage}</small>:null}</li>;
      })}
    </ol>}
    {!challenge&&!result?<form id="gitlab-deploy-form" className="gitlab-inline-form" onSubmit={event=>{event.preventDefault();void prepare();}}><label>部署域名<input autoComplete="off" value={domain} disabled={busy||status.locked} onChange={event=>{domainTouched.current=true;setDomain(event.target.value);}} onBlur={()=>void persistDomain(domain)}/></label><fieldset disabled={busy||status.locked}><legend>发布环境</legend><label className="modal-check"><input type="radio" name="deploy-environment" value="test" checked={environment==='test'} onChange={()=>selectEnvironment('test')}/>测试环境</label><label className="modal-check"><input type="radio" name="deploy-environment" value="production" checked={environment==='production'} onChange={()=>selectEnvironment('production')}/>正式环境</label></fieldset></form>:null}
    {challenge&&<><dl className="gitlab-inline-dl"><dt>GitLab用户</dt><dd>{challenge.gitlab_user}</dd><dt>官网</dt><dd>{challenge.domain}</dd><dt>网站仓库</dt><dd>{challenge.repository}</dd><dt>环境</dt><dd className={challenge.environment==='production'?'production-label':''}>{challenge.environment==='production'?'正式环境':'测试环境'}</dd><dt>本地 main</dt><dd>{challenge.local}</dd><dt>云端 main</dt><dd>{challenge.remote||'空仓库'}</dd><dt>部署仓库</dt><dd>{challenge.deploy_repository}</dd><dt>基准分支</dt><dd>{challenge.deploy_branch}</dd><dt>部署基准</dt><dd>{challenge.deploy}</dd></dl>{challenge.uncommitted&&<p className="deploy-inline-note">本地存在未提交修改；确认后会先提交最新文件，再核对并推送。</p>}<p className="deployment-summary is-passed">预检已通过</p>{challenge.kind==='create'&&<p className="deploy-inline-note">官网仓库不存在。是否在指定分组创建 {challenge.domain} 并绑定？创建完成后会再次确认发布。</p>}{challenge.kind==='bind'&&<p className={`deploy-inline-note${challenge.force_overwrite?' is-danger':''}`}>{challenge.force_overwrite?'检测到本地与云端版本存在冲突，确认后将以本地为准绑定仓库，并在发布时强制覆盖云端版本与部署。':'绑定将以本地为准，不覆盖本地源码；绑定完成后将进入发布确认。'}</p>}{challenge.kind==='publish'&&<p className={`deploy-inline-note${challenge.force_overwrite?' is-danger':''}`}>{challenge.force_overwrite?'检测到本地与云端版本存在冲突，确认后将以本地为准强制覆盖云端版本与部署。':'确认后将提交并核对推送官网 main，再通过 GitLab API 创建本官网专用的北京时间发布标签，触发部署流水线。'}</p>}</>}
    {result&&<p role="status">{result.message||'操作完成'}</p>}
    {error&&<p className="deployment-error" role="alert">{error}</p>}
  </>;
  const footer=!challenge&&!result?<footer>{inline?onBack&&<button type="button" disabled={!canCancel} onClick={()=>void backOrCancel()}>返回</button>:<button type="button" disabled={busy||status.locked} onClick={()=>void openPluginModal('settings',{},true).catch(error=>setError(error.message))}>插件配置</button>}<button className="primary" type="submit" form="gitlab-deploy-form" disabled={busy||status.locked||!domain||!environment}>{busy?'检查中…':'开始检查并发布'}</button></footer>
    :challenge?<footer><button type="button" disabled={!canCancel} onClick={()=>void close()}>返回</button><button className="primary" disabled={busy||!decision} onClick={()=>void execute()}>{busy?'执行中…':challenge.kind==='create'?'确认创建仓库':challenge.kind==='bind'?(challenge.force_overwrite?'确认以本地为准并绑定':'确认绑定仓库'):challenge.force_overwrite?`确认强制覆盖并发布到${challenge.environment==='production'?'正式':'测试'}环境`:`确认发布到${challenge.environment==='production'?'正式':'测试'}环境`}</button></footer>
    :result&&inline?<footer><button type="button" onClick={()=>{setResult(null);onBack?.();}}>返回</button><button type="button" className="primary" onClick={()=>void close()}>完成</button></footer>
    :null;
  if(inline)return <><header><div className="deploy-header-main"><h2 id="deploy-title">{label}</h2><ProjectIdChip projectId={projectId}/></div><button aria-label="关闭部署面板" onClick={()=>void close()}>×</button></header><div className="deploy-popup-body">{content}</div>{footer}</>;
  return <>{open&&<section className="plugin-modal deploy-modal" role="dialog" aria-modal="true" aria-labelledby="deploy-title"><header><h2 id="deploy-title">{label}</h2></header><div className="deploy-popup-body">{content}</div>{footer}</section>}</>;
}

export function DeploymentControls({projectId,panelId,threadId,onLocked}:{projectId:string;panelId:string;threadId?:string;onLocked:(locked:boolean)=>void}){
 const button=useRef<HTMLButtonElement>(null);
 const popupRef=useRef<HTMLElement>(null);
 const [open,setOpen]=useState(false);
 const [mode,setMode]=useState<'select'|'r2'|'gitlab'>('select');
 const [r2State,setR2State]=useState<any>({});
 const [gitlabStatus,setGitlabStatus]=useState<any>({});
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [copied,setCopied]=useState(false);
 const [position,setPosition]=useState({left:12,top:12});

 const callR2=useCallback((action:string)=>pluginControl({type:'r2',action,project_id:projectId,panel_id:panelId,thread_id:threadId}),[projectId,panelId,threadId]);
 const callGitLab=useCallback((action:string)=>pluginControl({type:'deploy',action,project_id:projectId,panel_id:panelId,thread_id:threadId}),[projectId,panelId,threadId]);

 useEffect(()=>{
  let stopped=false,inflight=false;
  const poll=async()=>{
   if(inflight)return;
   inflight=true;
   try{
    const [r2Res,gitlabRes]=await Promise.allSettled([callR2('status'),callGitLab('status')]);
    if(stopped)return;
    const nextR2=r2Res.status==='fulfilled'?r2Res.value:null;
    const nextGitLab=gitlabRes.status==='fulfilled'?gitlabRes.value:null;
    if(nextR2)setR2State(nextR2);
    if(nextGitLab)setGitlabStatus(nextGitLab);
    onLocked(Boolean((nextR2??r2State)?.locked||(nextGitLab??gitlabStatus)?.locked));
   }finally{inflight=false;}
  };
  void poll();
  const timer=setInterval(()=>void poll(),500);
  return()=>{stopped=true;clearInterval(timer);};
 },[callR2,callGitLab,onLocked]);

 useEffect(()=>{
  if(!open)return;
  const layout=()=>{
   const rect=button.current?.getBoundingClientRect();
   const popup=popupRef.current;
   if(!rect)return;
   const width=popup?.offsetWidth||(mode==='gitlab'?480:380);
   const height=popup?.offsetHeight||320;
   const left=Math.max(12,rect.left-width-12);
   const idealTop=rect.top+rect.height/2-height/2;
   const top=Math.max(12,Math.min(idealTop,innerHeight-height-12));
   setPosition(prev=>prev.left===left&&prev.top===top?prev:{left,top});
  };
  layout();
  const observer=typeof ResizeObserver!=='undefined'&&popupRef.current?new ResizeObserver(layout):null;
  if(observer&&popupRef.current)observer.observe(popupRef.current);
  addEventListener('resize',layout);
  return()=>{observer?.disconnect();removeEventListener('resize',layout);};
 },[open,mode]);

 useEffect(()=>{
  if(copied){const timer=setTimeout(()=>setCopied(false),2000);return()=>clearTimeout(timer);}
 },[copied]);

 const startR2=async()=>{
  setBusy(true);setError('');
  try{
   const value=await callR2('start');
   setR2State(value);
   onLocked(Boolean(value.locked||gitlabStatus.locked));
  }catch(err){setError((err as Error).message);}
  finally{setBusy(false);}
 };

 const show=async()=>{
  setOpen(true);setError('');
  try{
   const [r2Res,gitlabRes]=await Promise.allSettled([callR2('status'),callGitLab('status')]);
   const nextR2=r2Res.status==='fulfilled'?r2Res.value:r2State;
   const nextGitLab=gitlabRes.status==='fulfilled'?gitlabRes.value:gitlabStatus;
   if(r2Res.status==='fulfilled')setR2State(nextR2);
   if(gitlabRes.status==='fulfilled')setGitlabStatus(nextGitLab);
   setMode(nextR2?.locked&&nextR2?.id?'r2':nextGitLab?.locked?'gitlab':'select');
  }catch(err){setError((err as Error).message);}
 };

 const chooseR2=async()=>{
  setMode('r2');setError('');
  try{
   const value=await callR2('status');
   setR2State(value);
   if(!value.id&&!value.locked)await startR2();
  }catch(err){setError((err as Error).message);}
 };

 const chooseGitLab=()=>{
  setError('');
  setMode('gitlab');
 };

 const cancelR2=async()=>{
  try{setR2State(await callR2('cancel'));}
  catch(err){setError((err as Error).message);}
 };

 const copy=async()=>{
  try{await navigator.clipboard.writeText(r2State.url);setCopied(true);setError('');}
  catch{setError('复制失败，请选中链接后手动复制');}
 };

 const preview=async()=>{
  try{await callR2('preview');setError('');}
  catch(err){setError((err as Error).message);}
 };

 const r2Active=Boolean(r2State.locked||busy);
 const active=Boolean(r2Active||gitlabStatus.locked);
 const percent=r2State.total?Math.round((r2State.completed||0)/r2State.total*100):0;

 const popupStyle={...position,maxHeight:`calc(100vh - ${position.top+12}px)`};

 return <>
  <button ref={button} aria-label="部署网站" title="部署网站" aria-expanded={open} className={active?'active':''} onClick={()=>void show()}><Icon name="deploy"/></button>
  {open&&createPortal(<div className="r2-popup-overlay" onPointerDown={event=>{if(event.target===event.currentTarget)setOpen(false);}}>
   {mode==='select'?<section ref={popupRef} className="r2-deploy-popup" style={popupStyle} role="dialog" aria-modal="true" aria-label="部署网站">
    <header><div className="deploy-header-main"><h2>部署网站</h2><ProjectIdChip projectId={projectId}/></div><button aria-label="关闭部署面板" onClick={()=>setOpen(false)}>×</button></header>
    <p className="deploy-mode-hint">请选择部署方式：</p>
    <div className="deploy-mode-list">
     <button type="button" className="deploy-mode-option" disabled={Boolean(gitlabStatus.locked||busy)} onClick={()=>void chooseR2()}>
      <span className="deploy-mode-title">部署到预览环境{r2State.status==='completed'&&r2State.url?<small className="deploy-mode-badge">已部署</small>:null}</span>
      <span className="deploy-mode-desc">同步静态资源到预览服务器，生成临时预览链接</span>
     </button>
     <button type="button" className="deploy-mode-option" disabled={Boolean(r2Active)} onClick={chooseGitLab}>
      <span className="deploy-mode-title">部署到线上环境{gitlabStatus.locked?<small className="deploy-mode-badge">进行中</small>:null}</span>
      <span className="deploy-mode-desc">通过 GitLab 仓库与发布标签部署到测试或正式环境</span>
     </button>
    </div>
    {gitlabStatus.locked&&<p className="deployment-running" role="status"><span className="prompt-spinner"/>{gitlabStatus.stage||'GitLab 发布进行中'}</p>}
    {error&&<p className="r2-error" role="alert">{error}</p>}
   </section>:mode==='gitlab'?<section ref={popupRef} className="r2-deploy-popup is-gitlab" style={popupStyle} role="dialog" aria-modal="true" aria-labelledby="deploy-title">
    <DeploymentPanel projectId={projectId} panelId={panelId} threadId={threadId} inline onBack={()=>{setError('');setMode('select');}} onClose={()=>setOpen(false)}/>
   </section>:<section ref={popupRef} className="r2-deploy-popup" style={popupStyle} role="dialog" aria-modal="true" aria-label="预览环境部署">
    <header><div className="deploy-header-main"><h2>部署到预览环境</h2><ProjectIdChip projectId={projectId}/></div><button aria-label="关闭部署面板" onClick={()=>setOpen(false)}>×</button></header>
    <div className="deploy-popup-body">
     <p role="status">{r2State.phase||'准备部署'}</p>
     {r2Active&&<div className="r2-progress"><progress max={100} value={percent}/><span>{percent}% · {r2State.completed||0}/{r2State.total||0} 个文件</span></div>}
     {r2State.total_bytes>0&&<p>{((r2State.uploaded_bytes||0)/1048576).toFixed(2)} / {(r2State.total_bytes/1048576).toFixed(2)} MB{r2State.deleted>0?` · 已清理 ${r2State.deleted} 个失效文件`:''}</p>}
     {r2State.current_file&&r2Active&&<p className="r2-current-file">{r2State.current_file}</p>}
     {r2State.message&&r2State.status!=='completed'&&<p className={r2State.status==='failed'?'r2-error':''}>{r2State.message}</p>}
     {r2State.status==='completed'&&r2State.url&&<div className="r2-result"><div className="r2-link-field"><input aria-label="预览链接" aria-hidden="true" tabIndex={-1} type="text" readOnly autoComplete="off" value={r2State.url}/><a className="r2-preview-anchor" href={r2State.url} title="在外部浏览器中打开" onClick={event=>{event.preventDefault();void preview();}}>{r2State.url}</a><button className="r2-copy-button" aria-label={copied?'已复制':'复制链接'} title={copied?'已复制':'复制链接'} onClick={()=>void copy()}><Icon name="copy"/></button></div></div>}
     {error&&<p className="r2-error" role="alert">{error}</p>}
    </div>
    <footer>{r2Active?<button disabled={r2State.status==='cancelling'} onClick={()=>void cancelR2()}>{r2State.status==='cancelling'?'正在取消…':'取消部署'}</button>:<><button type="button" onClick={()=>{setError('');setMode('select');}}>返回</button><button className="primary" onClick={()=>void startR2()}>{r2State.status==='completed'?'重新部署':'开始部署'}</button></>}</footer>
   </section>}
  </div>,document.body)}
 </>;
}
