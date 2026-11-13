import { manageProjects } from './project-api';
import { readResource } from './resources';

export async function resourceBlob(url:string) {
  const value=await readResource(url,true);return (await fetch(value.data)).blob();
}
async function pngBlob(blob:Blob) {
  const url=URL.createObjectURL(blob),image=new Image();
  try {
    image.src=url;await image.decode();
    if(blob.type==='image/png')return blob;
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    const context=canvas.getContext('2d');if(!context)throw Error('图片无法转换');
    context.drawImage(image,0,0);return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('图片无法转换')),'image/png'));
  }finally{URL.revokeObjectURL(url);}
}
export async function copyPNG(load:()=>Promise<Blob>,notify:(text:string)=>void) {
  try {
    if(!navigator.clipboard?.write||typeof ClipboardItem==='undefined')throw Error('当前环境不支持图片剪贴板');
    const data=Promise.resolve().then(load).then(pngBlob);
    void data.catch(()=>{});
    const item=new ClipboardItem({'image/png':data});
    notify('正在准备图片…');await navigator.clipboard.write([item]);notify('图片已复制到剪贴板');
  }catch(error){notify(`复制失败：${(error as Error).message}`);}
}
export async function capturePage(input:{panel_id:string;thread_id?:string;project_id:string;path:string;width:number},html:string) {
  const bytes=new Uint8Array(await new Response(new Blob([html]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  let binary='';for(let offset=0;offset<bytes.length;offset+=32768)binary+=String.fromCharCode(...bytes.subarray(offset,offset+32768));
  const encoded=btoa(binary),capture_id=crypto.randomUUID();let result:any;
  for(let offset=0;offset<encoded.length;offset+=512000)result=await manageProjects({...input,action:'capture',capture_id,chunk:encoded.slice(offset,offset+512000),offset,final:offset+512000>=encoded.length});
  if(!result?.resource)throw Error('完整截图未生成');return resourceBlob(result.resource);
}
