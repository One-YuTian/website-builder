import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import type { App } from '@modelcontextprotocol/ext-apps';

export type PromptContent = Parameters<App['sendMessage']>[0]['content'];
export type CreatedProject = {project_id:string;thread_id:string|null;name:string;directory:string};

export function ProjectPrompt({send,onCreated}:{send:(text:string,content:PromptContent,signal:AbortSignal,files:File[])=>Promise<CreatedProject>;onCreated:(project:CreatedProject)=>void}) {
  const [text,setText]=useState('');
  const [files,setFiles]=useState<File[]>([]);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState('');
  const picker=useRef<HTMLInputElement>(null);
  const operation=useRef<AbortController|null>(null);
  const locked=useRef(false);
  useEffect(()=>()=>operation.current?.abort(),[]);
  const submit=async()=>{
    if(locked.current||(!text.trim()&&!files.length))return;
    locked.current=true;setPending(true);setError('');
    const controller=new AbortController();operation.current=controller;
    try{
      const content:PromptContent=[{type:'text',text:text.trim()||'请根据附件创建网站。'}];
      for(const file of files){
        const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error(`无法读取 ${file.name}`));reader.readAsDataURL(file);});
        const mime=file.type||'application/octet-stream';
        if(/^image\/(png|jpeg|webp|gif)$/.test(mime))content.push({type:'image',data,mimeType:mime,_meta:{'openai/title':file.name}});
        else content.push({type:'resource',resource:{uri:`attachment://${crypto.randomUUID()}/${encodeURIComponent(file.name)}`,mimeType:mime,blob:data}});
      }
      const project=await send(text.trim(),content,controller.signal,files);
      if(controller.signal.aborted)return;
      setText('');setFiles([]);setPending(false);locked.current=false;onCreated(project);
    }catch(error){if(!controller.signal.aborted){setError((error as Error).message);setPending(false);locked.current=false;}}
  };
  return <form className="project-prompt" aria-label="网站需求" aria-busy={pending} onSubmit={event=>{event.preventDefault();void submit();}}>
    {files.length>0&&<div className="prompt-files">{files.map((file,index)=><span key={`${file.name}-${index}`} title={file.name}>{file.name}<button type="button" aria-label={`移除 ${file.name}`} disabled={pending} onClick={()=>setFiles(previous=>previous.filter((_,i)=>i!==index))}>×</button></span>)}</div>}
    <textarea aria-label="项目需求" placeholder="描述你想构建的网站…" value={text} disabled={pending} onChange={event=>setText(event.target.value)} />
    <div className="prompt-toolbar">
      <input ref={picker} type="file" multiple hidden aria-label="选择图片或文件" onChange={event=>{
        const selected=[...files,...Array.from(event.target.files||[])];
        if(selected.length>10||selected.reduce((sum,file)=>sum+file.size,0)>12*1024*1024)setError('最多选择10个文件，总大小不超过12MB。');
        else{setFiles(selected);setError('');}
        event.target.value='';
      }}/>
      <button className="prompt-upload" type="button" aria-label="添加图片或文件" title="添加图片或文件" disabled={pending} onClick={()=>picker.current?.click()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg></button>
      <button className="prompt-send" type="submit" aria-label={pending?'正在创建项目':'发送需求'} title={pending?'正在等待项目创建':'新建对话并提交需求'} disabled={pending||(!text.trim()&&!files.length)}>{pending?<span className="prompt-spinner" aria-hidden="true"/>:<Icon name="send"/>}</button>
    </div>
    {error&&<div className="prompt-error" role="alert">{error}</div>}
  </form>;
}
