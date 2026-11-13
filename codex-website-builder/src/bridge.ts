import { App } from '@modelcontextprotocol/ext-apps';
export const hostApp = window.parent !== window ? new App({ name: 'codex-website-builder', version: '0.6.7' }) : null;
let launchThread:string|undefined;
export const getLaunchThread=()=>launchThread;
if(hostApp)hostApp.ontoolresult=params=>{
  const launch=params.structuredContent?.canvas_launch as {thread_id?:string}|undefined;
  if(typeof launch?.thread_id==='string'&&launch.thread_id){launchThread=launch.thread_id;window.dispatchEvent(new Event('website-builder:launch'));}
};
export const hostReady = hostApp ? hostApp.connect() : Promise.resolve();
