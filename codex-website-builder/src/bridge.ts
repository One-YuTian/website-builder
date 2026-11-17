import { App } from '@modelcontextprotocol/ext-apps';
export const hostApp = window.parent !== window ? new App({ name: 'codex-website-builder', version: '0.9.1' }) : null;
let launchThread:string|undefined;
let panelInput:Record<string,unknown>|undefined;
export const getPanelInput=()=>panelInput;
export const getLaunchThread=()=>launchThread;
if(hostApp)hostApp.ontoolinput=params=>{panelInput=params.arguments;window.dispatchEvent(new Event('website-builder:panel-input'));};
if(hostApp)hostApp.ontoolresult=params=>{
  const launch=params.structuredContent?.canvas_launch as {thread_id?:string;scope?:'thread'|'global'}|undefined;
  if(typeof launch?.thread_id==='string'&&launch.thread_id){launchThread=launch.thread_id;window.dispatchEvent(new Event('website-builder:launch'));}
};
export const hostReady = hostApp ? hostApp.connect() : Promise.resolve();
