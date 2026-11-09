import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
type Template={id:string;category:string;group:string;file:string;summary:string};
export async function readTemplates(skillRoot:string,input:{mode:'select'|'summary'|'doc'|'code';ids?:string[];category?:string;brief?:string;section?:'html'|'js'|'css'|'all'}) {
  const catalog:Template[]=JSON.parse(await readFile(join(skillRoot,'catalog.json'),'utf8'));
  if(input.mode==='select') {
    const slots=['header','carousel','categories','productlist','promotion','services','footer','card','shop','detail','about','contact','cart','checkout','login','register','wishlist'];
    return slots.flatMap(category=>{const options=catalog.filter(item=>item.category===category);const varied=options.filter(item=>!item.id.endsWith('-01'));const pool=varied.length?varied:options;if(!pool.length)return [];const hash=createHash('sha256').update(`${input.brief||''}:${category}`).digest().readUInt32BE();const chosen=pool[hash%pool.length];return [{id:chosen.id,category:chosen.category,summary:chosen.summary}];});
  }
  const selected=input.ids?.length?input.ids.map(id=>{const found=catalog.find(item=>item.id===id);if(!found)throw new Error(`模板不存在：${id}`);return found;}):catalog.filter(item=>!input.category||item.category===input.category);
  if(input.mode==='summary')return selected.map(({id,category,summary})=>({id,category,summary}));
  if(!input.ids?.length||input.ids.length>12)throw new Error('每次只读取本轮要使用的 1–12 个模板');
  return Promise.all(selected.map(async item=>{
    const text=await readFile(join(skillRoot,'templates',item.file),'utf8');
    if(input.mode==='doc')return{id:item.id,doc:text.match(/## Overview([\s\S]*?)(?=## Code|$)/)?.[1].trim()||''};
    const section=input.section||'all',result:Record<string,string>={id:item.id};
    for(const [part,label,language] of [['html','HTML','html'],['js','JavaScript','javascript'],['css','CSS','css']])if(section==='all'||section===part){const match=text.match(new RegExp(`### ${label}\\s*\x60\x60\x60${language}([\\s\\S]*?)\x60\x60\x60`));if(match)result[part]=match[1].trim();}
    return result;
  }));
}
