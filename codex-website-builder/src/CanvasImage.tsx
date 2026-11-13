import { useEffect, useState } from 'react';
import { Icon } from './Icons';
import { copyPNG,resourceBlob } from './clipboard';
import { readResource } from './resources';

export type CanvasAsset={id:string;name:string;path:string;url?:string;mime:string;status?:'generating'|'ready'|'error';error?:string;width?:number;height?:number};
export function CanvasImage({asset,notify}:{asset:CanvasAsset;notify:(value:string)=>void}) {
  const [width,setWidth]=useState(320);
  const [src,setSrc]=useState(''),[error,setError]=useState(''),[dimensions,setDimensions]=useState('');
  const [decoded,setDecoded]=useState(false);
  const plannedWidth=Math.max(320,Math.min(asset.width||960,960,(asset.width||960)*600/(asset.height||600)));
  useEffect(()=>{let stopped=false;setSrc('');setError('');setDecoded(false);setWidth(320);setDimensions('');if(asset.url&&asset.status!=='generating'&&asset.status!=='error')void readResource(asset.url,true).then(value=>{if(!stopped)setSrc(value.data);}).catch(error=>{if(!stopped)setError(error.message);});return()=>{stopped=true;};},[asset.url,asset.status]);
  const failure=asset.status==='error'?asset.error||'图片生成失败，请重试':error;
  return <article className="asset-panel" style={{width:decoded?width:plannedWidth}} data-asset={asset.path} data-status={failure?'error':decoded?'ready':'generating'} aria-busy={!decoded&&!failure}>
    <div className="asset-label"><span><Icon name="images"/>{asset.name}</span><button aria-label={`复制图片 ${asset.name}`} title="复制原尺寸图片" disabled={!decoded} onClick={()=>void copyPNG(()=>resourceBlob(asset.url!),notify)}><Icon name="copy"/></button></div>
    <div className="asset-surface">{src&&!failure?<img src={src} alt={asset.name} onError={()=>setError('图片无法解码，请检查生成文件')} onLoad={event=>{const {naturalWidth:w,naturalHeight:h}=event.currentTarget;setDecoded(true);setDimensions(`${w} × ${h}`);setWidth(Math.max(320,Math.min(w,960,w*600/h)));}}/>:null}{!decoded&&<div className={`asset-placeholder${failure?' is-error':''}`} style={{width:'100%',height:Math.max(96,Math.min(600,(asset.height||600)*Math.min(1,plannedWidth/(asset.width||960))))}} role="status">{!failure&&<div className="page-loader"/>}<span>{failure||(asset.status==='generating'?'图片生成中…':'图片加载中…')}</span></div>}</div>
    <p className="asset-caption">{dimensions||asset.mime}</p>
  </article>;
}
