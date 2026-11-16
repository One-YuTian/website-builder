import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {GitLabWorkflow,type GitLabIntent} from './gitlab-workflow';
import type {ProjectStore} from './projects';

export function registerGitLabTools(server:McpServer,workflow:GitLabWorkflow,store:ProjectStore){
  let formUnavailable=false;
  const ask=async(message:string,properties:any,required:string[])=>{
    const capabilities=server.server.getClientCapabilities();
    if(formUnavailable||!capabilities?.elicitation||capabilities.elicitation.url&&!capabilities.elicitation.form)return null;
    try{return await server.server.elicitInput({... (capabilities.elicitation.form?{mode:'form'}:{}),message,requestedSchema:{type:'object',properties,required}} as any);}
    catch(error){if([-32601,-32602].includes((error as any).code)){formUnavailable=true;return null;}throw error;}
  };
  const confirm=async(initial:any,actor:string,intent:GitLabIntent,projectId:string):Promise<any>=>{
    let result=initial;
    while(result.status==='confirmation_required'){
      const p=result.challenge;
      let answer;
      try{answer=await ask(`确认 ${p.kind}：${p.domain}；仓库 ${p.repository}；环境 ${p.environment||'不发布'}；部署仓库 ${p.deploy_repository} / ${p.deploy_branch}；本地 ${p.local}、云端 ${p.remote||'空仓库'}。发布时会提交最新文件并普通推送main。cloud将先备份再覆盖本地；发布会触发部署流水线。`,{approved:{type:'boolean',title:'我确认执行上述操作'},...(p.choices.length>1?{decision:{type:'string',title:'内容来源',enum:p.choices}}:{})},['approved',...(p.choices.length>1?['decision']:[])]);}
      catch(error){workflow.cancel(projectId,actor,p.id);throw error;}
      if(!answer)return {...result,next_action:'必须使用Codex提问对话框展示challenge并等待用户确认；确认后携带confirmation_id=challenge.id与decision继续。不得自行批准；取消时decision=cancel。'};
      if(answer.action!=='accept'||answer.content?.approved!==true)return workflow.cancel(projectId,actor,p.id);
      result=await workflow.execute(p.id,actor,String(answer.content.decision||'confirm'),intent,projectId);
    }
    return result;
  };
  const names:Record<GitLabIntent,string>={create:'website_gitlab_create',bind:'website_gitlab_bind',commit:'website_gitlab_commit',push:'website_gitlab_push',deploy:'website_deploy'};
  for(const intent of Object.keys(names) as GitLabIntent[])server.registerTool(names[intent],{
    description:`${intent}: 严格核验配置、VPN/IP、Token身份、分组、部署仓库和官网仓库。先准备确认请求，不默认发布。创建仓库、域名、云端覆盖和发布环境必须经Codex确认对话框；支持MCP elicitation，无此能力时返回confirmation_required，Agent必须调用Codex提问工具取得真实用户答复后才能携带confirmation_id/decision继续，不得自行代答。非快进/冲突只提示用户确认后用系统Git处理，不强推。deploy仅以API在部署仓库创建一个官网对应的北京时间release/test标签，返回触发结果不代表网站已上线。`,
    inputSchema:{action:z.enum(['run','status','cancel']).default('run'),thread_id:z.string(),project_id:z.string(),domain:z.string().optional(),environment:z.enum(['test','production']).optional(),confirmation_id:z.string().optional(),decision:z.enum(['confirm','local','cloud','cancel']).optional()},
    annotations:{readOnlyHint:false,destructiveHint:true,openWorldHint:true},
  },async input=>{
    try{
      if(store.database.binding(input.thread_id)?.projectId!==input.project_id)throw Error('部署工具只能操作当前真实会话绑定的网站项目');
      if(input.action==='status')return {content:[{type:'text',text:JSON.stringify(workflow.status(input.project_id))}]};
      if(input.action==='cancel')return {content:[{type:'text',text:JSON.stringify(workflow.cancel(input.project_id,input.thread_id,input.confirmation_id))}]};
      if(input.confirmation_id){
        if(input.decision==='cancel')return {content:[{type:'text',text:JSON.stringify(workflow.cancel(input.project_id,input.thread_id,input.confirmation_id))}]};
        const challenge=workflow.challenge(input.confirmation_id,input.thread_id,input.project_id);
        const capabilities=server.server.getClientCapabilities();
        const native=!formUnavailable&&!!capabilities?.elicitation&&(!capabilities.elicitation.url||!!capabilities.elicitation.form);
        const result=native?{status:'confirmation_required',challenge}:await workflow.execute(input.confirmation_id,input.thread_id,input.decision||'',intent,input.project_id);
        return {content:[{type:'text',text:JSON.stringify(await confirm(result,input.thread_id,intent,input.project_id))}]};
      }
      let domain=input.domain,environment=input.environment;
      if(!domain||intent==='deploy'&&!environment){
        const answer=await ask('确认要操作的真实官网域名；部署时请选择测试或正式环境。',{domain:{type:'string',title:'真实官网域名，例如 www.example.com'},...(intent==='deploy'?{environment:{type:'string',title:'发布环境',enum:['test','production'],description:'test为测试环境，production为正式环境'}}:{})},['domain',...(intent==='deploy'?['environment']:[])]);
        if(!answer)return {content:[{type:'text',text:JSON.stringify({status:'input_required',questions:['请在Codex确认对话框询问真实www域名',...(intent==='deploy'?['请在确认发布对话框询问测试/正式环境']:[])],next_action:'使用Codex提问工具等待用户回答，再调用本工具；不能自动填写确认结果'})}]};
        if(answer.action!=='accept')return {content:[{type:'text',text:JSON.stringify({status:'cancelled'})}]};
        domain=String(answer.content?.domain||'');environment=answer.content?.environment as any;
      }
      const result=await workflow.prepare({project_id:input.project_id,actor:input.thread_id,intent,domain:domain!,environment});
      return {content:[{type:'text',text:JSON.stringify(await confirm(result,input.thread_id,intent,input.project_id))}]};
    }catch(error){return {isError:true,content:[{type:'text',text:(error as Error).message}]};}
  });
}
