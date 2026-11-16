import {pluginControl} from './plugin-control';
import {hostApp} from './bridge';
export type PanelContext={view:'settings'|'deploy';project_id?:string;panel_id?:string;thread_id?:string};
declare global{interface Window{__WEBSITE_PANEL_CONTEXT__?:PanelContext;openai?:{requestModal?:(input:{template:string})=>Promise<unknown>;requestClose?:()=>void|Promise<void>};}}
export async function openPluginModal(view:PanelContext['view'],context:Omit<PanelContext,'view'>={}):Promise<boolean>{
 if(!window.openai?.requestModal)return false;
 const panel=await pluginControl({type:'panel',action:'open',view,...context});
 try{await window.openai.requestModal({template:panel.resource_uri});return true;}catch{return false;}
}
export async function closePluginModal(){if(window.openai?.requestClose)await window.openai.requestClose();else if(hostApp)await hostApp.requestTeardown();}
