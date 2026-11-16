import {useEffect,useState} from 'react';
import {pluginControl} from './plugin-control';
const fields=[['PROJECT_DIR','资源目录'],['GITLAB_HOST','GitLab HOST'],['GITLAB_IP','GitLab IP'],['GITLAB_TOKEN','GitLab TOKEN'],['GITLAB_WEBSITE_DIR','官网分组地址'],['GITLAB_WEBSITE_DEPLOY_DIR','部署仓库地址'],['GITLAB_DEFAULT_BRANCH','部署基准分支']] as const;
export function PluginSettings(){
 const [values,setValues]=useState<Record<string,string>>({}),[busy,setBusy]=useState(false),[testing,setTesting]=useState(false),[message,setMessage]=useState(''),[report,setReport]=useState<any>(null);
 useEffect(()=>{let stopped=false;void pluginControl({type:'settings',action:'get'}).then(data=>{if(!stopped)setValues(data);}).catch(error=>{if(!stopped)setMessage(error.message);});return()=>{stopped=true;};},[]);
 const input=()=>Object.fromEntries(fields.filter(([name])=>name!=='PROJECT_DIR').map(([name])=>[name,values[name]||'']));
 const test=async()=>{setTesting(true);setReport(null);setMessage('');try{setReport(await pluginControl({type:'settings',action:'test',values:input()}));}catch(error){setMessage((error as Error).message);}finally{setTesting(false);}};
 const save=async()=>{setBusy(true);setMessage('');try{setValues(await pluginControl({type:'settings',action:'save',values:input()}));setMessage('配置已保存');}catch(error){setMessage((error as Error).message);}finally{setBusy(false);}};
 const inactive=busy||testing;
 return <section className="plugin-modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
  <header><div><h2 id="settings-title">插件配置</h2><p>管理项目目录与 GitLab 连接</p></div></header>
  <div className="settings-columns"><form id="plugin-settings-form" onSubmit={event=>{event.preventDefault();void save();}}>
   <h3>属性配置</h3>{fields.map(([name,label])=><label key={name}><span>{label}</span><input name={name} type="text" placeholder={name==='GITLAB_HOST'?'http://内网域名或IP:端口':undefined} autoComplete="off" spellCheck={false} disabled={name==='PROJECT_DIR'||inactive} readOnly={name==='PROJECT_DIR'} value={values[name]||''} onChange={event=>{setReport(null);setValues(old=>({...old,[name]:event.target.value}));}}/></label>)}
   <p className="settings-note">资源目录由插件自动设置。内网 HTTP 服务请填写 http:// 地址；Token 明文保存并回显，清空后保存即可删除。</p>
  </form><aside className="settings-test-pane" aria-label="连接测试结果"><div className="settings-test-heading"><h3>连接测试</h3><button type="button" disabled={inactive||!values.PROJECT_DIR} onClick={()=>void test()}>{testing?'测试中…':'测试连接'}</button></div>
   <p>使用当前输入进行只读检查，不保存配置、不发布网站。</p>{testing&&<p role="status"><span className="prompt-spinner"/>正在检查网络、身份与仓库…</p>}
   {report?<div className="connection-report" role="status"><p>{report.message}</p><ol>{report.checks.map((check:any)=><li key={check.name} data-status={check.status}><strong>{check.name} · {check.status==='passed'?'通过':check.status==='failed'?'失败':'未执行'}</strong><p>{check.detail}</p></li>)}</ol></div>:!testing&&<ol className="settings-test-steps"><li>配置地址与 IP 连通性</li><li>TLS / 证书（HTTP 自动跳过）</li><li>Token 用户身份</li><li>网站分组与部署仓库</li><li>部署基准分支</li></ol>}
  </aside></div><footer>{message&&<p role="status">{message}</p>}<button className="primary" type="submit" form="plugin-settings-form" disabled={inactive||!values.PROJECT_DIR}>{busy?'保存中…':'保存配置'}</button></footer>
 </section>;
}
