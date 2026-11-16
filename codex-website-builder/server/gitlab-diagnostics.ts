import {isIP} from 'node:net';
import {gitlabHost,gitlabPath,gitlabGroupPath,nodeGitLabIO,gitlabNetworkError,type GitLabIO} from './gitlab-transport';
import type {GitLabSettings} from './plugin-settings';
type Check={name:string;status:'pending'|'passed'|'failed'|'skipped';detail:string};
export async function testGitLabConnection(settings:GitLabSettings,io:GitLabIO=nodeGitLabIO()){
 const checks:Check[]=['配置地址','IP / OPEN VPN','TLS / 证书','Token 用户','网站分组','部署仓库','部署基准分支'].map(name=>({name,status:'pending',detail:''}));
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
 let current=0;
 const redact=(text:string)=>text.replaceAll(settings.GITLAB_TOKEN||'\u0000','[REDACTED]').slice(0,2500);
 const step=async(index:number,run:()=>Promise<string>)=>{current=index;checks[index].detail=redact(await run());checks[index].status='passed';};
 const api=async(path:string)=>{const result=await io.api(settings,'GET',path,undefined,controller.signal);if(result.status<200||result.status>=300){const hint=result.status===401?'Token 无效或已过期':result.status===403?'Token 权限不足':result.status===404?'地址不存在或当前 Token 无权访问':'请检查 GitLab 服务';throw Error(`HTTP ${result.status}：${hint}`);}return result.data;};
 try{
  let host='';await step(0,async()=>{if(!settings.GITLAB_HOST)throw Error('请填写 GITLAB_HOST');host=gitlabHost(settings.GITLAB_HOST);if(!isIP(settings.GITLAB_IP))throw Error('请填写有效 GITLAB_IP');return `${host} → ${settings.GITLAB_IP}`;});
  await step(1,async()=>{await io.probe(settings,controller.signal);return '指定 IP 和端口 TCP 连通（不代表 TLS/API 已通过）';});
  if(new URL(host).protocol==='https:')await step(2,async()=>{if(!io.tls)throw Error('当前连接适配器未提供 TLS 测试');return io.tls(settings,controller.signal);});else {checks[2].status='skipped';checks[2].detail='配置为 HTTP，不进行 TLS 测试';}
  await step(3,async()=>{if(!settings.GITLAB_TOKEN)throw Error('请填写 GITLAB_TOKEN');const user=await api('/user');if(!Number.isInteger(user?.id)||!user.username||user.state&&user.state!=='active')throw Error('Token 用户无效或已停用');return '身份验证通过：'+user.username;});
  await step(4,async()=>{if(!settings.GITLAB_WEBSITE_DIR)throw Error('请填写 GITLAB_WEBSITE_DIR');const path=gitlabGroupPath(settings.GITLAB_WEBSITE_DIR,host),group=await api('/groups/'+encodeURIComponent(path));if(!Number.isInteger(group?.id)||group.full_path!==path)throw Error('网站分组身份不匹配');return path;});
  let repository:any;await step(5,async()=>{if(!settings.GITLAB_WEBSITE_DEPLOY_DIR)throw Error('请填写 GITLAB_WEBSITE_DEPLOY_DIR');const path=gitlabPath(settings.GITLAB_WEBSITE_DEPLOY_DIR,host);repository=await api('/projects/'+encodeURIComponent(path));if(!Number.isInteger(repository?.id)||repository.archived||repository.path_with_namespace!==path)throw Error('部署仓库无效、已归档或身份不匹配');return path;});
  await step(6,async()=>{const branch=settings.GITLAB_DEFAULT_BRANCH||'main',value=await api(`/projects/${repository.id}/repository/branches/${encodeURIComponent(branch)}`);if(!/^[0-9a-f]{40}$/.test(value?.commit?.id||''))throw Error('部署基准分支没有有效提交');return branch+' · '+value.commit.id.slice(0,12);});
  return {success:true,message:'连接测试通过（只读检查，不创建仓库、不推送、不部署）',checks};
 }catch(error){checks[current].status='failed';checks[current].detail=redact(controller.signal.aborted?'连接测试已超时，请检查 VPN 与服务响应':gitlabNetworkError(error,settings).message);for(const check of checks)if(check.status==='pending'){check.status='skipped';check.detail='前置检查未通过，未执行';}return {success:false,message:'连接测试失败：'+checks[current].name,checks};}
 finally{clearTimeout(timer);}
}
