// Test-only TinyPNG fixture, inherited by isolated MCP child processes. No runtime bypass.
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
export function pngFixture(width=1,height=1,padding=0){
 const chunk=(type,data)=>{const name=Buffer.from(type),result=Buffer.alloc(data.length+12);result.writeUInt32BE(data.length);name.copy(result,4);data.copy(result,8);let crc=0xffffffff;for(const byte of Buffer.concat([name,data])){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}result.writeUInt32BE((crc^0xffffffff)>>>0,result.length-4);return result;};
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
 const raw=Buffer.alloc((width*4+1)*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*(width*4+1)+1+x*4;raw[i]=64;raw[i+1]=128;raw[i+2]=192;raw[i+3]=128;}
 return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),...(padding?[chunk('tEXt',Buffer.concat([Buffer.from('Note\0'),Buffer.alloc(padding,65)]))]:[]),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
const flag='--import='+import.meta.url;
if(!(process.env.NODE_OPTIONS||'').includes(flag))process.env.NODE_OPTIONS=((process.env.NODE_OPTIONS||'')+' '+flag).trim();
const original=globalThis.fetch,outputs=new Map();
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
 if(url.hostname==='tinypng.com'){
  if(init?.method==='POST'&&url.pathname==='/backend/opt/shrink'){const body=Buffer.from(init.body),id=createHash('sha256').update(body).digest('hex');outputs.set(id,body);return Response.json({output:{size:body.length,url:'https://tinypng.com/backend/opt/output/'+id}});}
  const body=outputs.get(url.pathname.split('/').pop());if(!body)throw Error('Unknown mock compression output');return new Response(body,{headers:{'content-length':String(body.length)}});
 }
 return original(input,init);
};
