import { spawn } from 'node:child_process';
import { stat,realpath } from 'node:fs/promises';
import { win32 } from 'node:path';

export function windowsShellPath(path:string) {
  if(path.startsWith('\\\\?\\UNC\\'))path='\\\\'+path.slice(8);
  else if(path.startsWith('\\\\?\\'))path=path.slice(4);
  return win32.normalize(path);
}

export const activateDirectoryScript=String.raw`
$ErrorActionPreference='Stop'
$target=[IO.Path]::GetFullPath($env:WEBSITE_BUILDER_OPEN_DIRECTORY).TrimEnd('\')
$shellApp=New-Object -ComObject Shell.Application
function Find-DirectoryWindows {
  @($shellApp.Windows() | Where-Object {
    try { [string]::Equals($_.Document.Folder.Self.Path.TrimEnd('\'),$target,[StringComparison]::OrdinalIgnoreCase) } catch { $false }
  })
}
$directoryWindows=@(Find-DirectoryWindows)
if(!$directoryWindows.Count) {
  $shellApp.Open($target)
  for($i=0;$i -lt 60 -and !$directoryWindows.Count;$i++){Start-Sleep -Milliseconds 100;$directoryWindows=@(Find-DirectoryWindows)}
}
if(!$directoryWindows.Count){exit 1}
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class WBDirectoryWindow {
 [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hwnd,int command);
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hwnd);
 [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hwnd);
 [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hwnd,IntPtr pid);
 [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
 [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint from,uint to,bool attach);
}
'@
$window=$directoryWindows[0];$handle=[IntPtr]$window.HWND
[void][WBDirectoryWindow]::ShowWindowAsync($handle,9)
$current=[WBDirectoryWindow]::GetCurrentThreadId()
$foreground=[WBDirectoryWindow]::GetWindowThreadProcessId([WBDirectoryWindow]::GetForegroundWindow(),[IntPtr]::Zero)
$attached=$false
try {
 if($foreground -ne $current){$attached=[WBDirectoryWindow]::AttachThreadInput($current,$foreground,$true)}
 [void][WBDirectoryWindow]::BringWindowToTop($handle)
 [void][WBDirectoryWindow]::SetForegroundWindow($handle)
} finally {if($attached){[void][WBDirectoryWindow]::AttachThreadInput($current,$foreground,$false)}}
Start-Sleep -Milliseconds 150
$active=[WBDirectoryWindow]::GetForegroundWindow().ToInt64()
if(@(Find-DirectoryWindows | Where-Object {$_.HWND -eq $active}).Count){exit 0}
[void](New-Object -ComObject WScript.Shell).AppActivate($window.LocationName)
Start-Sleep -Milliseconds 150
$active=[WBDirectoryWindow]::GetForegroundWindow().ToInt64()
if(@(Find-DirectoryWindows | Where-Object {$_.HWND -eq $active}).Count){exit 0}
exit 3
`;

export async function openDirectory(directory:string,platform:NodeJS.Platform=process.platform,start:typeof spawn=spawn) {
  if(!(await stat(directory)).isDirectory())throw Error('项目目录不存在');
  const windows=platform==='win32';
  const command=windows?win32.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe'):platform==='darwin'?'open':'xdg-open';
  const args=windows?['-NoProfile','-NonInteractive','-STA','-WindowStyle','Hidden','-Command',activateDirectoryScript]:[directory];
  const env=windows?{...process.env,WEBSITE_BUILDER_OPEN_DIRECTORY:windowsShellPath(await realpath(directory))}:undefined;
  await new Promise<void>((resolve,reject)=>{
    const child=start(command,args,{stdio:'ignore',shell:false,windowsHide:true,env,timeout:15000});
    child.once('error',()=>reject(Error('无法打开项目目录')));
    child.once('exit',code=>code===0?resolve():reject(Error(windows&&code===3?'目录已打开，但 Windows 未允许切换到前台':'无法打开项目目录')));
  });
}
