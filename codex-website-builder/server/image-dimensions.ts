import { open, stat } from 'node:fs/promises';
const cache=new Map<string,{key:string;dimensions:{width:number;height:number}|undefined}>();
// Read only metadata, so image rows reserve their real geometry before decoding.
export async function imageDimensions(path:string) {
  const info=await stat(path),key=`${info.size}:${info.mtimeMs}`;
  if(cache.get(path)?.key===key)return cache.get(path)!.dimensions;
  const file=await open(path,'r');
  try {
    const buffer=Buffer.alloc(Math.min(65536,info.size));await file.read(buffer,0,buffer.length,0);
    let width=0,height=0;
    if(buffer.length>=24&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){width=buffer.readUInt32BE(16);height=buffer.readUInt32BE(20);}
    else if(buffer.length>=10&&buffer.toString('ascii',0,3)==='GIF'){width=buffer.readUInt16LE(6);height=buffer.readUInt16LE(8);}
    else if(/\.svg$/i.test(path)){
      const source=buffer.toString('utf8').match(/<svg\b[^>]*>/i)?.[0]||'';
      const viewBox=source.match(/viewBox\s*=\s*["']\s*[-\d.e]+[ ,]+[-\d.e]+[ ,]+([\d.e]+)[ ,]+([\d.e]+)/i);
      width=Number(source.match(/\bwidth\s*=\s*["']([\d.]+)(?:px)?["']/i)?.[1]||viewBox?.[1]);
      height=Number(source.match(/\bheight\s*=\s*["']([\d.]+)(?:px)?["']/i)?.[1]||viewBox?.[2]);
    }else if(buffer.length>4&&buffer[0]===255&&buffer[1]===216){
      for(let offset=2;offset+9<buffer.length;){
        if(buffer[offset++]!==255)break;
        const marker=buffer[offset++];if(marker===255){offset--;continue;}
        const length=buffer.readUInt16BE(offset);if(length<2)break;
        if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){height=buffer.readUInt16BE(offset+3);width=buffer.readUInt16BE(offset+5);break;}
        offset+=length;
      }
    }
    const dimensions=Number.isFinite(width)&&Number.isFinite(height)&&width>0&&height>0?{width,height}:undefined;
    if(cache.size>=256)cache.delete(cache.keys().next().value!);
    cache.set(path,{key,dimensions});return dimensions;
  }finally{await file.close();}
}
