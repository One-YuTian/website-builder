import { useEffect, useState } from 'react';
import { Icon } from './Icons';
import { copyPNG,resourceBlob } from './clipboard';
import { readResource } from './resources';

export type CanvasAsset={id:string;name:string;path:string;url:string;mime:string};
export function CanvasImage({asset,notify}:{asset:CanvasAsset;notify:(value:string)=>void}) {
  const [width,setWidth]=useState(320);
  const [src,setSrc]=useState(''),[error,setError]=useState(''),[dimensions,setDimensions]=useState('');
  useEffect(()=>{let stopped=false;setSrc('');setError('');setWidth(320);setDimensions('');void readResource(asset.url,true).then(value=>{if(!stopped)setSrc(value.data);}).catch(error=>{if(!stopped)setError(error.message);});return()=>{stopped=true;};},[asset.url]);
  return <article className="asset-panel" style={{width}} data-asset={asset.path}>
    <div className="asset-label"><span><Icon name="images"/>{asset.name}</span><button aria-label={`复制图片 ${asset.name}`} title="复制原尺寸图片" disabled={!src} onClick={()=>void copyPNG(()=>resourceBlob(asset.url),notify)}><Icon name="copy"/></button></div>
    <div className="asset-surface">{src?<img src={src} alt={asset.name} onLoad={event=>{const {naturalWidth:w,naturalHeight:h}=event.currentTarget;setDimensions(`${w} × ${h}`);setWidth(Math.max(320,Math.min(w,960,w*600/h)));}}/>:<p>{error||'图片加载中…'}</p>}</div>
    <p className="asset-caption">{dimensions||asset.mime}</p>
  </article>;
}
