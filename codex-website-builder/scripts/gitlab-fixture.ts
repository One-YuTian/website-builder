// Test-only fixture: all GitLab traffic is handled in memory. Never imported by runtime.
import fs from 'node:fs';
import {mkdtemp,readFile,writeFile,cp,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRequire as fixtureRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {ProjectStore} from '../server/projects';
import {PluginSettings} from '../server/plugin-settings';
import {GitLabWorkflow} from '../server/gitlab-workflow';
export {registerGitLabTools} from '../server/gitlab-tools';
export {nodeGitLabIO,gitlabHost} from '../server/gitlab-transport';
export {testGitLabConnection} from '../server/gitlab-diagnostics';
export {registerNativeSettings} from '../server/native-settings';
export {R2Deployment,sourceSnapshot} from '../server/r2-deployment';
export {R2Settings} from '../server/r2-settings';
export async function fixture(){
  const root=await mkdtemp(join(tmpdir(),'website-gitlab-mock-')),store=new ProjectStore(join(root,'project'));
  const settings=new PluginSettings(root,store.root,{});
  await settings.save({GITLAB_HOST:'https://gitlab.invalid',GITLAB_IP:'192.0.2.10',GITLAB_TOKEN:'unit-secret-token',GITLAB_WEBSITE_DIR:'websites',GITLAB_WEBSITE_DEPLOY_DIR:'ops/deploy',GITLAB_DEFAULT_BRANCH:'main'});
  const view=await store.open({threadId:'mock-thread',name:'Mock website',pages:[]});
  await store.plan('mock-thread',[{path:'index.html',title:'Home'}]);
  await store.write('mock-thread',[{path:'index.html',content:'<!doctype html><html><head><title>Website</title></head><body><h1>Local content</h1></body></html>'}]);
  const git=fixtureRequire(import.meta.url)(fileURLToPath(new URL('../runtime/isomorphic-git/load.cjs',import.meta.url)));
  const state:any={site:null,siteHead:null,tags:new Map(),calls:[],fail:'',clock:new Date('2026-11-06T07:00:00Z'),remoteRoot:null,pushes:0,forcePushes:0,race:false,failPush:false};
  const site=()=>({id:11,path:'www.example.com',path_with_namespace:'websites/www.example.com',http_url_to_repo:'https://gitlab.invalid/websites/www.example.com.git',default_branch:state.siteHead?'main':null,empty_repo:!state.siteHead,...state.site});
  const io:any={tls:async()=>{state.calls.push({method:'TLS',path:'HANDSHAKE'});if(state.fail==='tls')throw Object.assign(Error('write EPROTO SSL routines:tlsv1 alert internal error:SSL alert number 80'),{code:'EPROTO'});return 'TLSv1.3，证书与域名校验通过';},probe:async()=>{state.calls.push({method:'PROBE',path:'IP'});if(state.fail==='vpn')throw Error('GITLAB_IP 无法连通，请检查 OPEN VPN 连接');},http:()=>({request:()=>{throw Error('Fixture must never use network');}}),api:async(_c:any,method:string,path:string,body:any)=>{
    state.calls.push({method,path,body});
    const response=(status:number,data:any)=>({status,data});
    if(path==='/user')return response(state.fail==='token'?401:200,{id:7,username:'tester',state:state.fail==='user'?'blocked':'active'});
    if(path==='/groups/websites')return response(state.fail==='group'?404:200,{id:3,full_path:'websites'});
    if(path==='/projects/ops%2Fdeploy')return response(state.fail==='deploy-repo'?404:200,{id:22,path_with_namespace:'ops/deploy'});
    if(path==='/projects/22/repository/branches/main')return response(state.fail==='deploy-branch'?404:200,{name:'main',commit:{id:'a'.repeat(40)}});
    if(path==='/projects/websites%2Fwww.example.com')return response(state.site?200:404,state.site?site():{});
    if(path==='/projects'&&method==='POST'){state.site={};return response(201,site());}
    if(path==='/projects/11/repository/branches?per_page=1')return response(200,state.siteHead?[{name:'main'}]:[]);
    if(path==='/projects/11/repository/tags?per_page=1')return response(200,[]);
    if(path==='/projects/11/repository/branches/main'){
      if(state.race&&store.database.sql.prepare('SELECT stage FROM deployment_locks WHERE project_id=?').get(view.project.id)?.stage==='核对并推送官网main')state.siteHead='f'.repeat(40);
      return response(state.siteHead?200:404,{name:'main',can_push:true,commit:{id:state.siteHead}});
    }
    if(path.startsWith('/projects/22/repository/tags/')&&method==='GET'){const tag=decodeURIComponent(path.split('/').pop()!);return response(state.tags.has(tag)?200:404,state.tags.get(tag)||{});}
    if(path==='/projects/22/repository/tags'&&method==='POST'){const tag={name:body.tag_name,message:body.message,commit:{id:body.ref}};state.tags.set(body.tag_name,tag);return response(201,tag);}
    throw Error('Unexpected MOCK endpoint '+method+' '+path);
  }};
  const fakeGit={...git,fetch:async(options:any)=>{if(state.remoteRoot)await cp(join(state.remoteRoot,'.git/objects'),join(options.dir,'.git/objects'),{recursive:true});},push:async(options:any)=>{if(!options.force&&state.failPush)throw Error('PushRejectedError: non-fast-forward');const auth=await options.onAuth();if(auth.password!=='unit-secret-token')throw Error('Wrong mock credential');state.pushes++;if(options.force)state.forcePushes++;state.siteHead=await git.resolveRef({fs,dir:options.dir,ref:'main'});return {ok:true};},clone:async(options:any)=>{if(!state.remoteRoot)throw Error('No cloud fixture');await cp(state.remoteRoot,options.dir,{recursive:true});await git.addRemote({fs,dir:options.dir,remote:'origin',url:options.url,force:true});}};
  const workflow=new GitLabWorkflow(store,settings,io,fakeGit,()=>state.clock);
  const input={project_id:view.project.id,actor:'mock-thread',intent:'deploy' as const,domain:'www.example.com',environment:'production' as const};
  return {root,store,settings,view,state,workflow,git,io,input,async origin(){await git.addRemote({fs,dir:view.projectDirectory.replaceAll('\\','/'),remote:'origin',url:site().http_url_to_repo,force:true});},async remote(){
    const remote=join(root,'remote-fixture');await mkdir(remote,{recursive:true});await git.init({fs,dir:remote.replaceAll('\\','/'),defaultBranch:'main'});await mkdir(join(remote,'src/images'),{recursive:true});await mkdir(join(remote,'material'),{recursive:true});
    await writeFile(join(remote,'README.md'),'# Cloud website\n');await writeFile(join(remote,'src/index.html'),'<!doctype html><html><head><title>Cloud website</title></head><body>Cloud content</body></html>');
    for(const filepath of ['README.md','src/index.html'])await git.add({fs,dir:remote.replaceAll('\\','/'),filepath});
    state.siteHead=await git.commit({fs,dir:remote.replaceAll('\\','/'),message:'Cloud initial',author:{name:'Cloud',email:'cloud@localhost'}});state.site={};state.remoteRoot=remote;return remote;
  }};
}

export {openPreviewBrowser} from '../server/open-browser';

export {imagePublisher} from '../server/image-compression';
export {projectManager} from '../server/project-manager';
