import {useEffect,useState} from 'react';
import {pluginControl} from './plugin-control';
import {closePluginModal} from './plugin-modal';
const previewFields=[['R2_ACCOUNT_ID','Account ID'],['R2_BUCKET_NAME','Bucket'],['R2_ACCESS_KEY_ID','Access Key'],['R2_SECRET_ACCESS_KEY','Secret Key'],['R2_DEPLOY_HOST','预览域名']] as const;
const gitlabFields=[['GITLAB_HOST','GitLab HOST'],['GITLAB_IP','GitLab IP'],['GITLAB_TOKEN','GitLab TOKEN'],['GITLAB_WEBSITE_DIR','官网分组地址'],['GITLAB_WEBSITE_DEPLOY_DIR','部署仓库地址'],['GITLAB_DEFAULT_BRANCH','部署基准分支']] as const;
export function PluginSettings(){
 const [values,setValues]=useState<Record<string,string>>({}),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[testing,setTesting]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState<{title:string;detail?:string}|null>(null);
 useEffect(()=>{if(!notice&&!error)return;const timer=setTimeout(()=>{setNotice('');setError(null);},4000);return()=>clearTimeout(timer);},[notice,error]);
 useEffect(()=>{let stopped=false;void pluginControl({type:'settings',action:'get'}).then(data=>{if(!stopped){setValues(data);setLoaded(true);}}).catch(err=>{if(!stopped)setError({title:(err as Error).message});});return()=>{stopped=true;};},[]);
 const input=()=>Object.fromEntries(gitlabFields.map(([name])=>[name,values[name]||'']));
 const test=async()=>{setTesting(true);setNotice('');setError(null);try{const next=await pluginControl({type:'settings',action:'test',values:input()});if(next?.success){setNotice('测试连接成功');}else{const item=next?.checks?.find((check:any)=>check.status==='failed');setError({title:`测试连接失败：${item?.name||'检查异常'}`,detail:item?.detail||next?.message});}}catch(err){setError({title:(err as Error).message});}finally{setTesting(false);}};
 const save=async()=>{setBusy(true);setNotice('');setError(null);try{const saved=await pluginControl({type:'settings',action:'save',values:input()});setValues(old=>({...old,...saved}));setNotice('配置已保存');await closePluginModal();}catch(err){setError({title:(err as Error).message});}finally{setBusy(false);}};
 const inactive=busy||testing;
 return <section className="plugin-modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
  {error&&<div className="message error" role="alert"><strong>{error.title}</strong>{error.detail?<span>{error.detail}</span>:null}<button type="button" aria-label="关闭错误提示" onClick={()=>setError(null)}>×</button></div>}
  {notice&&!error&&<div className="message" role="status"><span>{notice}</span><button type="button" aria-label="关闭提示" onClick={()=>setNotice('')}>×</button></div>}
  <header><div><h2 id="settings-title">插件配置</h2></div></header>
  <div className="settings-main">
   <fieldset className="settings-section settings-group" aria-label="预览环境配置">
    <legend>预览环境配置</legend>
    <div className="settings-grid settings-readonly-grid">
     {previewFields.map(([name,label])=><label key={name}><span>{label}</span><input name={name} type="text" readOnly disabled value={values[name]||''}/></label>)}
    </div>
   </fieldset>
   <form id="plugin-settings-form" className="settings-section settings-group" onSubmit={event=>{event.preventDefault();void save();}}>
    <h3 className="settings-group-title">线上部署配置</h3>
    <div className="settings-grid settings-form-grid">
     {gitlabFields.map(([name,label])=><label key={name}><span>{label}</span><input name={name} type="text" placeholder={name==='GITLAB_HOST'?'http://内网域名或IP:端口':undefined} autoComplete="off" spellCheck={false} disabled={inactive||!loaded} value={values[name]||''} onChange={event=>setValues(old=>({...old,[name]:event.target.value}))}/></label>)}
    </div>
   </form>
  </div>
  <footer><button type="button" className="settings-btn-secondary" disabled={inactive||!loaded} onClick={()=>void test()}>{testing?<><span className="prompt-spinner" aria-hidden="true"/>测试中…</>:'测试连接'}</button><button className="primary" type="submit" form="plugin-settings-form" disabled={inactive||!loaded}>{busy?'保存中…':'保存配置'}</button></footer>
 </section>;
}
