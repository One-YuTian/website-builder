import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {win32} from 'node:path';
const execute=promisify(execFile);
export async function openPreviewBrowser(value:string,platform:NodeJS.Platform=process.platform,run:typeof execute=execute){
 const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('预览地址无效');
 try{
  if(platform==='win32')await run(win32.join(process.env.SystemRoot||'C:\\Windows','System32/WindowsPowerShell/v1.0/powershell.exe'),['-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop'; Start-Process -FilePath $env:WEBSITE_BUILDER_PREVIEW_URL"],{windowsHide:true,timeout:15000,env:{...process.env,WEBSITE_BUILDER_PREVIEW_URL:url.href}});
  else await run(platform==='darwin'?'/usr/bin/open':'xdg-open',[url.href],{timeout:15000});
  return {opened:true,url:url.href};
 }catch{throw Error('无法打开外部浏览器，请复制预览链接后手动打开');}
}
