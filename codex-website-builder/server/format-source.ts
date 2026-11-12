import { readFile } from 'node:fs/promises';
import { validateSource } from './validate-source';

let runtime:Promise<{prettier:any;plugins:any[];options:any}>|undefined;
function load() {
  return runtime ||= (async()=>{
    const root=new URL('../runtime/prettier/',import.meta.url);
    const [prettier,...plugins]=await Promise.all(['standalone.mjs','plugins/babel.mjs','plugins/estree.mjs','plugins/html.mjs','plugins/postcss.mjs'].map(file=>import(new URL(file,root).href)));
    return {prettier,plugins,options:JSON.parse(await readFile(new URL('options.json',root),'utf8'))};
  })();
}
export async function formatSource(path:string,source:string) {
  validateSource(path,source);
  const parser=/\.html?$/i.test(path)?'html':/\.(?:m?js)$/i.test(path)?'babel':/\.css$/i.test(path)?'css':/\.json$/i.test(path)?'json-stringify':undefined;
  if(!parser)return source;
  // Never let a formatter repair unfinished HTML into a falsely ready page.
  if(parser==='html'&&(!/<html\b/i.test(source)||!/<\/body>/i.test(source)||!/<\/html>\s*$/i.test(source)))return source;
  if(parser==='html')for(const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if(/\bsrc\s*=/i.test(match[1]))continue;
    const type=match[1].match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1].toLowerCase()||'';
    if(type==='application/json'||type==='application/ld+json')validateSource(`${path}:inline.json`,match[2]);
    else if(!type||type==='module'||/^(?:text|application)\/(?:javascript|ecmascript)$/.test(type))validateSource(`${path}:inline.js`,match[2]);
  }
  try {
    const {prettier,plugins,options}=await load();
    const formatted=await prettier.format(source,{...options,parser,plugins});
    validateSource(path,formatted);return formatted;
  } catch(error) { throw Error(`${path} Prettier格式化失败：${(error as Error).message}`); }
}
