import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory = new URL('../assets/vendor/', import.meta.url);
await mkdir(directory,{recursive:true});
const entries = [
 ['https://cdn.tailwindcss.com','tailwind.js'],
 ['https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js','jquery.js'],
 ['https://cdnjs.cloudflare.com/ajax/libs/Swiper/10.3.1/swiper-bundle.min.js','swiper.js'],
 ['https://cdnjs.cloudflare.com/ajax/libs/Swiper/10.3.1/swiper-bundle.min.css','swiper.css'],
 ['https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.3/font/bootstrap-icons.min.css','bootstrap-icons.css'],
 ['https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap','nunito.css']
];
const manifest={};
for(const [url,file] of entries){
 const response=await fetch(url);if(!response.ok)throw new Error(`${url}: ${response.status}`);
 let body=Buffer.from(await response.arrayBuffer());
 if(file.endsWith('.css')){
  let css=body.toString();
  for(const match of [...css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)]){
   if(match[1].startsWith('data:'))continue;
   const remote=new URL(match[1],url);const ext=remote.pathname.match(/\.[a-z0-9]+$/i)?.[0]||'.bin';
   const name=createHash('sha256').update(remote.href).digest('hex').slice(0,16)+ext;
   const font=await fetch(remote);if(!font.ok)throw new Error(`${remote}: ${font.status}`);
   await writeFile(new URL(name,directory),Buffer.from(await font.arrayBuffer()));
   css=css.replaceAll(match[0],`url("${name}")`);
  }
  body=Buffer.from(css);
 }
 await writeFile(new URL(file,directory),body);manifest[url]=file;console.log(`Saved ${file}: ${body.length} bytes`);
}
await writeFile(new URL('manifest.json',directory),JSON.stringify(manifest,null,2));
