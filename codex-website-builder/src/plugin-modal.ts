import {hostApp,getPanelInput} from './bridge';
export type PanelContext={
  view:'settings'|'deploy'|'image-preview';
  project_id?:string;
  panel_id?:string;
  thread_id?:string;
  url?:string;
  name?:string;
};
type ModalView={mode?:string;params?:Record<string,unknown>};
let notifiedView:ModalView|undefined,hasNotifiedView=false;
declare global{interface Window{__WEBSITE_PANEL_CONTEXT__?:PanelContext;openai?:{view?:ModalView;toolInput?:Record<string,unknown>;requestModal?:(input:{title:string;template?:string;params?:Record<string,unknown>})=>Promise<unknown>;requestClose?:()=>void|Promise<void>};}}
export async function openPluginModal(view:PanelContext['view'],context:Omit<PanelContext,'view'>={},required=false):Promise<boolean>{
 if(view==='settings'){
  if(!window.openai?.requestModal){if(required)throw Error('当前宿主未提供 window.openai.requestModal，无法打开插件级 UI 设置弹窗。请更新或启用支持此接口的宿主后重试。');return false;}
  try{await window.openai.requestModal({title:'插件配置',params:{view,...context}});return true;}
  catch(error){if(required)throw Error('插件级 UI 设置弹窗打开失败：'+(error as Error).message);return false;}
 }
 if(view==='image-preview'){
  if(!window.openai?.requestModal){if(required)throw Error('当前宿主未提供 window.openai.requestModal，无法打开插件级 UI 图片预览弹窗。');return false;}
  try{await window.openai.requestModal({title:context.name||'图片预览',params:{view,...context}});return true;}
  catch(error){if(required)throw Error('插件级 UI 图片预览弹窗打开失败：'+(error as Error).message);return false;}
 }
 if(!window.openai?.requestModal){if(required)throw Error('当前宿主未提供 window.openai.requestModal，无法打开插件级 UI 发布弹窗。');return false;}
 try{await window.openai.requestModal({title:'部署网站',params:{view,...context}});return true;}catch(error){if(required)throw Error('插件级 UI 发布弹窗打开失败：'+(error as Error).message);return false;}
}
export const isPluginModal=()=>(hasNotifiedView?notifiedView:window.openai?.view)?.mode==='modal';
export function getPluginPanelContext(globals?:Record<string,unknown>):PanelContext|undefined{
 if(globals&&'view' in globals){hasNotifiedView=true;notifiedView=globals.view as ModalView|undefined;}
 const view=hasNotifiedView?notifiedView:window.openai?.view;
 for(const candidate of [view?.params,getPanelInput(),window.openai?.toolInput]){
  if(!candidate)continue;
  const input=candidate.view?candidate:candidate.params as Record<string,unknown>|undefined;
  if(input?.view==='settings')return {view:'settings'};
  if(input?.view==='image-preview'&&typeof input.url==='string')return {view:'image-preview',url:input.url,name:typeof input.name==='string'?input.name:undefined};
  if(input?.view==='deploy'&&typeof input.project_id==='string'&&typeof input.panel_id==='string')return {view:'deploy',project_id:input.project_id,panel_id:input.panel_id,...(typeof input.thread_id==='string'?{thread_id:input.thread_id}:{})};
 }
 return window.__WEBSITE_PANEL_CONTEXT__;
}
export async function closePluginModal(){if(window.openai?.requestClose)await window.openai.requestClose();else if(hostApp)await hostApp.requestTeardown();}
