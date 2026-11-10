import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
type Template={id:string;category:string;group:string;file:string;summary:string};
export async function readTemplates(skillRoot:string,input:{mode:'select'|'summary'|'doc'|'code';ids?:string[];category?:string;brief?:string;section?:'html'|'js'|'css'|'all'}) {
  const catalog:Template[]=JSON.parse(await readFile(join(skillRoot,'catalog.json'),'utf8'));
  if(input.mode==='select') {
    const slots=[...new Set(catalog.map(item=>item.category))];
    return slots.filter(category=>!input.category||input.category===category).flatMap(category=>{
      const candidates=catalog.filter(item=>item.category===category).map(({id,summary})=>({id,summary}));
      return candidates.length?[{category,candidates,selection:'Unranked candidates. Agent chooses compatible templates after deciding the site palette, light/dark strategy, content widths and layout. Include only needed sections; -01 is valid. No theme or width is chosen by this tool.'}]:[];
    });
  }
  const selected=input.ids?.length?input.ids.map(id=>{const found=catalog.find(item=>item.id===id);if(!found)throw new Error(`模板不存在：${id}`);return found;}):catalog.filter(item=>!input.category||item.category===input.category);
  if(input.mode==='summary')return selected.map(({id,category,summary})=>({id,category,summary}));
  if(!input.ids?.length||input.ids.length>12)throw new Error('每次只读取本轮要使用的 1–12 个模板');
  return Promise.all(selected.map(async item=>{
    const text=await readFile(join(skillRoot,'templates',item.file),'utf8');
    if(input.mode==='doc')return{id:item.id,doc:text.match(/## Overview([\s\S]*?)(?=## Code|$)/)?.[1].trim()||''};
    const section=input.section||'all',result:Record<string,string>={id:item.id,overview:text.match(/## Overview([\s\S]*?)(?=## Code|$)/)?.[1].trim()||'',usage:'Use this source and region map as the implementation reference. Fidelity is SKILL guidance only; no automatic similarity score or readiness gate. Source bindings are optional traceability. Agent decides a coherent site design and validates actual rendering and interactions.'};
    for(const [part,label,language] of [['html','HTML','html'],['js','JavaScript','javascript'],['css','CSS','css']])if(section==='all'||section===part){const match=text.match(new RegExp(`### ${label}\\s*\x60\x60\x60${language}([\\s\\S]*?)\x60\x60\x60`));if(match)result[part]=match[1].trim();}
    result.requiredParts=['HTML','JavaScript','CSS'].filter(label=>text.includes(`### ${label}`)).join(', ');
    result.integrationNotes='Agent chooses a coherent palette/light-dark strategy/content width in app.js; demo colors and widths are not defaults. Keep the selected template slots, responsive columns and Swiper; do not invent extra regions. Adapt all tags and registrations to unique xxx-component names, with one registration per constructor. New cart output is either direct cart.html or components/cart.js drawer, not both. Commerce configuration lives in app.js. No fidelity scoring or forced source formatting is performed. Do not restore demo wrappers.';
    return result;
  }));
}
