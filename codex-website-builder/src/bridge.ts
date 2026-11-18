import { App } from '@modelcontextprotocol/ext-apps';
export const hostApp = window.parent !== window ? new App({ name: 'codex-website-builder', version: '0.9.2' }) : null;
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

export type ThemeMode = 'light' | 'dark';
let notifiedTheme: ThemeMode | undefined;

export function resolveTheme(globals?: Record<string, unknown>): ThemeMode {
  if (globals && (globals.theme === 'dark' || globals.theme === 'light')) {
    notifiedTheme = globals.theme;
  }
  const openaiTheme = (window as unknown as { openai?: { theme?: string } }).openai?.theme;
  const hostTheme = hostApp?.getHostContext()?.theme;
  const detected = notifiedTheme
    || (openaiTheme === 'dark' || openaiTheme === 'light' ? openaiTheme : undefined)
    || (hostTheme === 'dark' || hostTheme === 'light' ? hostTheme : undefined);
  if (detected) return detected;
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}
