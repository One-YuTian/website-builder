import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
type ShopLayout={summary:string;columns:string;regions:string[];mobile:string};
function overview(text:string,layout?:ShopLayout){
  const original=text.match(/## Overview([\s\S]*?)(?=## Code|$)/)?.[1].trim()||'';
  if(!layout)return original;
  return original.replace(/^(?:Shop catalog page|About Us corporate brand page)[^\n]*/m,layout.summary).replace(/### Dimensions & Responsiveness[\s\S]*?(?=### Attributes)/,`### Dimensions & Responsiveness\n- Grid: ${layout.columns}.\n- Regions: ${layout.regions.join(', ')}.\n- Mobile: ${layout.mobile}.\n- Container follows selected source and site theme.\n\n`);
}
type Template={id:string;category:string;group:string;file:string;summary:string};
export async function readTemplates(skillRoot:string,input:{mode:'select'|'summary'|'doc'|'code';ids?:string[];category?:string;brief?:string;section?:'html'|'js'|'css'|'all';usage?:Record<string,{projects:number;lastUsed?:string}>}) {
  const shopLayouts:Record<string,ShopLayout>=JSON.parse(await readFile(join(skillRoot,'references/shop-layouts.json'),'utf8'));
  Object.assign(shopLayouts,JSON.parse(await readFile(join(skillRoot,'references/about-layouts.json'),'utf8')));
  const catalog:Template[]=JSON.parse(await readFile(join(skillRoot,'catalog.json'),'utf8'));
  for(const item of catalog)if(shopLayouts[item.id])item.summary=shopLayouts[item.id].summary;
  if(input.mode==='select') {
    const slots=[...new Set(catalog.map(item=>item.category))];
    return slots.filter(category=>!input.category||input.category===category).flatMap(category=>{
      const candidates=catalog.filter(item=>item.category===category).map(({id,summary})=>({id,summary,...(input.usage?{usage:input.usage[id]||{projects:0}}:{})}));
      return candidates.length?[{category,candidates,selection:'Unranked candidates. Agent chooses compatible templates after deciding the site palette, light/dark strategy, content widths and layout. Include only needed sections; -01 is valid. No theme or width is chosen by this tool. Compare at least 3 Shop/About candidates (or all if fewer). Use actual region/layout differences and project usage history to avoid always choosing the first or most-used layout; prefer a compatible less-used alternative for a new site. Existing-site edits retain the current layout unless redesign is requested.'}]:[];
    });
  }
  const selected=input.ids?.length?input.ids.map(id=>{const found=catalog.find(item=>item.id===id);if(!found)throw new Error(`模板不存在：${id}`);return found;}):catalog.filter(item=>!input.category||item.category===input.category);
  if(input.mode==='summary')return selected.map(({id,category,summary})=>({id,category,summary}));
  if(!input.ids?.length||input.ids.length>12)throw new Error('每次只读取本轮要使用的 1–12 个模板');
  return Promise.all(selected.map(async item=>{
    const text=await readFile(join(skillRoot,'templates',item.file),'utf8');
    if(input.mode==='doc')return{id:item.id,doc:overview(text,shopLayouts[item.id])};
    const section=input.section||'all',result:Record<string,string>={id:item.id,overview:overview(text,shopLayouts[item.id]),usage:'Use this source and region map as the implementation reference. Fidelity is SKILL guidance only; no automatic similarity score or readiness gate. Source bindings are optional traceability. Agent decides a coherent site design and validates actual rendering and interactions.'};
    for(const [part,label,language] of [['html','HTML','html'],['js','JavaScript','javascript'],['css','CSS','css']])if(section==='all'||section===part){const match=text.match(new RegExp(`### ${label}\\s*\x60\x60\x60${language}([\\s\\S]*?)\x60\x60\x60`));if(match)result[part]=match[1].trim();}
    if(shopLayouts[item.id])result.layoutContract=JSON.stringify(shopLayouts[item.id]);
    result.requiredParts=['HTML','JavaScript','CSS'].filter(label=>text.includes(`### ${label}`)).join(', ');
    result.integrationNotes='Agent chooses a coherent palette/light-dark strategy/content width in app.js; demo colors and widths are not defaults. Keep the selected template slots, responsive columns and Swiper; do not invent extra regions. Adapt all tags and registrations to unique xxx-component names, with one registration per constructor. Default new cart output to components/cart.js drawer; cart.html only when explicitly requested or required by an existing page-mode site, never both. Logo must be an img/picture asset. Mobile (<768px) root font-size is exactly 12px. Complete homepages add 1–2 distinct category/story/promotion/service sections beyond header/footer/hero/product list, without repeating the same section. Commerce configuration lives in app.js. No fidelity scoring or forced source formatting is performed. Do not restore demo wrappers. Actual HTML layout overrides generic Overview and global radius/spacing suggestions. For Shop read the paired Card code, replace defaultProducts with SDK queries, map every legacy tag/selector to card-component, and preserve all filters/drawers/grid-list behavior. No character/emoji icons or hand-drawn SVG product/banner images.';
    return result;
  }));
}
