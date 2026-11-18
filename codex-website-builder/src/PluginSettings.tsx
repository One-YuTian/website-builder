import {useEffect,useState} from 'react';
import {pluginControl} from './plugin-control';
import {closePluginModal} from './plugin-modal';
const previewFields=[['R2_ACCOUNT_ID','Account ID'],['R2_BUCKET_NAME','Bucket'],['R2_ACCESS_KEY_ID','Access Key'],['R2_SECRET_ACCESS_KEY','Secret Key'],['R2_DEPLOY_HOST','预览域名']] as const;
const gitlabFields=[['GITLAB_HOST','GitLab HOST'],['GITLAB_IP','GitLab IP'],['GITLAB_TOKEN','GitLab TOKEN'],['GITLAB_WEBSITE_DIR','官网分组地址'],['GITLAB_WEBSITE_DEPLOY_DIR','部署仓库地址'],['GITLAB_DEFAULT_BRANCH','部署基准分支']] as const;
export function PluginSettings(){
 const [values,setValues]=useState<Record<string,string>>({}),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[testing,setTesting]=useState(false),[message,setMessage]=useState(''),[report,setReport]=useState<any>(null);
 useEffect(()=>{let stopped=false;void pluginControl({type:'settings',action:'get'}).then(data=>{if(!stopped){setValues(data);setLoaded(true);}}).catch(error=>{if(!stopped)setMessage(error.message);});return()=>{stopped=true;};},[]);
 const input=()=>Object.fromEntries(gitlabFields.map(([name])=>[name,values[name]||'']));
 const test=async()=>{setTesting(true);setReport(null);setMessage('');try{setReport(await pluginControl({type:'settings',action:'test',values:input()}));}catch(error){setMessage((error as Error).message);}finally{setTesting(false);}};
 const save=async()=>{setBusy(true);setMessage('');try{const saved=await pluginControl({type:'settings',action:'save',values:input()});setValues(old=>({...old,...saved}));setMessage('配置已保存');await closePluginModal();}catch(error){setMessage((error as Error).message);}finally{setBusy(false);}};
 const inactive=busy||testing;
 const failed=report&&!report.success?report.checks?.find((check:any)=>check.status==='failed'):null;
 return <section className="plugin-modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
  <header><div><h2 id="settings-title">插件配置</h2><p>查看预览环境配置与管理线上部署连接</p></div></header>
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
     {gitlabFields.map(([name,label])=><label key={name}><span>{label}</span><input name={name} type="text" placeholder={name==='GITLAB_HOST'?'http://内网域名或IP:端口':undefined} autoComplete="off" spellCheck={false} disabled={inactive||!loaded} value={values[name]||''} onChange={event=>{setReport(null);setValues(old=>({...old,[name]:event.target.value}));}}/></label>)}
    </div>
    <p className="settings-note">内网 HTTP 服务请填写 http:// 地址；Token 明文保存并回显，清空后保存即可删除。</p>
   </form>
   {testing&&<p className="settings-test-status" role="status"><span className="prompt-spinner"/>正在测试连接…</p>}
   {report&&<div className={`connection-result ${report.success?'is-passed':'is-failed'}`} role="status">
    <strong>{report.success?'测试连接成功':`测试连接失败：${failed?.name||'检查异常'}`}</strong>
    <span>{report.success?report.message:(failed?.detail||report.message)}</span>
   </div>}
  </div>
  <footer>{message&&<p role="status">{message}</p>}<button type="button" className="settings-btn-secondary" disabled={inactive||!loaded} onClick={()=>void test()}>{testing?'测试中…':'测试连接'}</button><button className="primary" type="submit" form="plugin-settings-form" disabled={inactive||!loaded}>{busy?'保存中…':'保存配置'}</button></footer>
 </section>;
}
