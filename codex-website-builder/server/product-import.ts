import { commerceAssets } from './commerce-assets';
import { readFile, stat } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { ProjectStore } from './projects';
import { formatSource } from './format-source';

type Product = Record<string,any>;
type Group = {id:string;label:string;categories:string[];product_ids:string[];count:number;image:string;source_categories?:string[]};
export interface ImportInput {
  thread_id:string;project_id:string;action?:'inspect'|'import';file_path?:string;source_json?:string;
  website_domain?:string;image_cdn?:string;currency?:string;locale?:string;field_map?:Record<string,string>;category_map?:Record<string,string>;category_offset?:number;category_limit?:number;
}
const valueAt=(item:any,path:string)=>path.split('.').reduce((value,key)=>value && Object.hasOwn(value,key)?value[key]:undefined,item);
const text=(value:any):string=>typeof value==='string'?value.trim():typeof value==='number'?String(value):'';
function amount(value:any,locale:string):number|undefined {
  if(typeof value==='number')return Number.isFinite(value)&&value>=0?value:undefined;
  if(typeof value!=='string')return undefined;
  const parts=new Intl.NumberFormat(locale).formatToParts(12345.6),group=parts.find(part=>part.type==='group')?.value,decimal=parts.find(part=>part.type==='decimal')?.value;
  let result=value.trim().replace(/^(?:[A-Z]{3}|[$€£¥])\s*|\s*(?:[A-Z]{3}|[$€£¥])$/g,'');
  if(group)result=result.split(group).join('');if(decimal&&decimal!=='.')result=result.replace(decimal,'.');
  if(!/^\d+(?:\.\d+)?$/.test(result))return undefined;
  const number=Number(result);return Number.isFinite(number)?number:undefined;
}
function imageBase(input:ImportInput) {
  if(input.image_cdn){const url=new URL(input.image_cdn);if(!/^https?:$/.test(url.protocol)||url.username||url.password)throw Error('图片CDN必须使用无凭据HTTP(S)地址');return url.href.replace(/\/?$/,'/');}
  if(!input.website_domain)return undefined;
  const domain=new URL(/^https?:\/\//.test(input.website_domain)?input.website_domain:`https://${input.website_domain}`);
  if(!/^https?:$/.test(domain.protocol)||domain.username||domain.password||domain.port)throw Error('网站域名无效');
  const host=domain.hostname.replace(/^www\./i,'');
  return `https://${host.startsWith('cdn.')?host:`cdn.${host}`}/`;
}
function normalizeImage(value:any) {
  if(value&&typeof value==='object')value=value.url??value.src??value.hi_res??value.large??value.link;
  const path=text(value);if(!path)return '';
  if(/^(?:https?:)?\/\//i.test(path)){const url=new URL(path.startsWith('//')?`https:${path}`:path);return url.username||url.password?'':path;}
  if(/^[a-z][a-z\d+.-]*:/i.test(path)||path.includes('\\'))return '';
  return path;
}
function normalize(source:any,input:ImportInput) {
  let rows=source;
  if(!Array.isArray(rows))rows=source?.products??source?.productData??source?.items??source?.data?.products??source?.data?.items??source?.data;
  if(!Array.isArray(rows)||!rows.length)throw Error('未识别到非空商品数组（支持数组/products/productData/items/data等包装）');
  if(rows.length>100000)throw Error('商品数量超过100000条导入上限');
  const base=imageBase(input),locale=input.locale||'en-US',seen=new Set<string>();
  const aliases:Record<string,string[]>={id:['id','asin','product_id','sku'],name:['name','title','product_name'],category:['category','category_name','categories'],brand:['brand','brand_name'],final_price:['final_price','price.value','price.amount','price.current','price'],main_image:['main_image','image','image_url','thumbnail'],images:['images','image_urls'],description:['description','product_description']};
  const pick=(row:any,key:string)=>{for(const path of input.field_map?.[key]?[input.field_map[key]]:aliases[key]||[key]){const value=valueAt(row,path);if(value!==undefined&&value!==null&&value!=='')return value;}};
  const products=rows.map((row:any,index:number)=>{
    if(!row||typeof row!=='object'||Array.isArray(row))throw Error(`商品${index+1}不是对象`);
    const id=text(pick(row,'id')),name=text(pick(row,'name')),price=amount(pick(row,'final_price'),locale);
    if(!id||!name||price===undefined||seen.has(id))throw Error(`商品${index+1}的ID/名称/数值价格不可识别或ID重复`);
    seen.add(id);
    const rawCategory=pick(row,'category'),category=text(Array.isArray(rawCategory)?rawCategory[0]:rawCategory)||'Uncategorized';
    const images=pick(row,'images'),paths=(Array.isArray(images)?images:[]).map(item=>normalizeImage(item)).filter(Boolean);
    const mainImage=normalizeImage(pick(row,'main_image'))||paths[0]||'';
    const result:Product={id,name,brand:text(pick(row,'brand')),category,final_price:price,main_image:mainImage,images:[...new Set([mainImage,...paths].filter(Boolean))],description:text(pick(row,'description')),features:Array.isArray(row.features)?row.features:[],specifications:Array.isArray(row.specifications)?row.specifications:[],variants:Array.isArray(row.variants)?row.variants:[],variant_options:Array.isArray(row.variant_options)?row.variant_options:[],comments:Array.isArray(row.comments)?row.comments:[]};
    for(const field of ['subcategory','sub_category','product_type','type','monthly_sales','parent_category']){const value=text(pick(row,field));if(value)result[field]=value;}
    for(const field of ['features','specifications','variants','variant_options','comments']){const value=pick(row,field);result[field]=Array.isArray(value)?value:[];}
    for(const field of ['rating','reviews_count']){const value=pick(row,field);if(value!==undefined){const number=Number(value);if(Number.isFinite(number)&&number>=0&&(field!=='rating'||number<=5))result[field]=number;else delete result[field];}}
    const original=amount(pick(row,'original_price'),locale);if(original!==undefined&&original>price){result.original_price=original;result.discount=`${Math.round((1-price/original)*100)}%`;}else{delete result.original_price;delete result.discount;}
    return result;
  });
  return {products,base};
}
function classify(products:Product[],sdk:any) {
  const byId=new Map(products.map(item=>[item.id,item]));
  const group=(label:string,items:Product[]):Group=>({id:'',label,categories:[...new Set(items.map(item=>item.category))],product_ids:items.map(item=>item.id),count:items.length,image:items.find(item=>item.main_image)?.main_image||''});
  const sorted=(groups:Group[])=>groups.sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label));
  let groups=sorted(sdk.categories().map((category:string)=>group(category,sdk.list().filter({category}).result())));
  if(groups.length>6)throw Error('二次分类尚未收敛到不超过6个主要分类');
  // Secondary display groups use real subcategories/types/brands, never invent
  // empty categories or mutate the original category field just to reach six.
  while(groups.length<5){
    let changed=false;
    for(const parent of [...groups]){
      const rows:Product[]=parent.product_ids.map(id=>byId.get(id)!);
      for(const key of ['subcategory','sub_category','product_type','type','brand']){
        const buckets=new Map<string,Product[]>();for(const row of rows){const label=text(row[key])||'Other';buckets.set(label,[...(buckets.get(label)||[]),row]);}
        if(buckets.size<2)continue;
        let children=sorted([...buckets].map(([label,items])=>group(`${parent.label} / ${label}`,items)));
        const capacity=6-(groups.length-1);
        if(children.length>capacity){const tail=children.slice(capacity-1).flatMap(item=>item.product_ids.map(id=>byId.get(id)!));children=[...children.slice(0,capacity-1),group(`${parent.label} / Other`,tail)];}
        groups=groups.flatMap(item=>item===parent?children:[item]);changed=true;break;
      }
      if(changed)break;
    }
    if(!changed)break;
  }
  return groups.map((item,index)=>({...item,id:`category-${String(index+1).padStart(2,'0')}`}));
}
export async function importProducts(store:ProjectStore,skillRoot:string,input:ImportInput) {
  if(input.action&&!['inspect','import'].includes(input.action))throw Error('action必须为inspect或import');
  const view=await store.get(input.thread_id);if(!view||view.project.id!==input.project_id)throw Error('当前会话项目不匹配');
  if(Number(Boolean(input.file_path))+Number(input.source_json!==undefined)!==1)throw Error('file_path与source_json必须且只能提供一个');
  let source:string;
  if(input.file_path){if(!isAbsolute(input.file_path)||!/\.json$/i.test(input.file_path))throw Error('需要用户提供的JSON文件绝对路径');const info=await stat(input.file_path);if(info.size>64*1024*1024)throw Error('JSON文件超过64MB读取上限');source=await readFile(input.file_path,'utf8');}
  else{source=input.source_json!;if(Buffer.byteLength(source)>64*1024*1024)throw Error('JSON超过64MB读取上限');}
  imageBase(input); // Invalid caller configuration is not unrecognizable product data.
  const fingerprint=createHash('sha256').update(source).digest('hex');
  let normalized:ReturnType<typeof normalize>;
  try{normalized=normalize(JSON.parse(source.replace(/^\uFEFF/,'')),input);}catch(error){return{mode:'mock',fallback:true,next_skill:'website-mock-data',reason:(error as Error).message,written:[],source_sha256:fingerprint,note:'原始JSON和现有商品数据未改写；主技能接续Mock Data工作流，不把失败导入冒充成功。'};}
  // Execute only the trusted bundled SDK, never JavaScript supplied by the data.
  const window:any={productData:normalized.products};
  runInNewContext(await readFile(join(skillRoot,'assets/commerce/sdk.js'),'utf8'),{window,Intl},{timeout:2000});
  const config={currency:input.currency||'USD',locale:input.locale||'en-US',storageKey:`website-builder:${view.project.id}`};
  window.SDK.init(normalized.products,config);
  const sourceCategories:string[]=window.SDK.categories();
  const offset=input.category_offset??0,limit=input.category_limit??200;
  if(!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>200)throw Error('分类摘要分页参数无效');
  const category_page={offset,limit,total:sourceCategories.length,next_offset:offset+limit<sourceCategories.length?offset+limit:null};
  const sourceCounts=sourceCategories.map(name=>({name,count:window.SDK.list().filter({category:name}).count()}));
  let mapping=input.category_map;
  if(!mapping&&sourceCategories.length>6){
    const derived:Record<string,string>=Object.create(null);let consistent=true;
    for(const item of normalized.products){const parent=text(item.parent_category);if(!parent||derived[item.category]&&derived[item.category]!==parent){consistent=false;break;}derived[item.category]=parent;}
    const count=new Set(Object.values(derived)).size;
    if(consistent&&count>=2&&count<=6)mapping=derived;
  }
  const missing=mapping?sourceCategories.filter(name=>!text(mapping![name])):sourceCategories;
  if((mapping&&missing.length)||sourceCategories.length>6&&!mapping||mapping&&new Set(Object.values(mapping).map(text)).size>6){
    return{mode:'classification_required',fallback:false,written:[],product_count:window.SDK.count(),source_category_count:sourceCategories.length,category_count:sourceCategories.length,source_categories:sourceCounts.slice(offset,offset+limit),category_page,categories_truncated:sourceCounts.length>200,needs_secondary_classification:true,missing_categories:missing.slice(offset,offset+limit),image_cdn:normalized.base||null,source_sha256:fingerprint,note:'商品数据可识别；请根据原分类摘要提交覆盖全部源分类的category_map，合并为约5–6个有意义的主要分类，再调用本工具。不要沿用前5源类+More，不转Mock，不改源文件。'};
  }
  for(const item of normalized.products){item.source_category=item.category;if(mapping)item.category=text(mapping[item.category]);}
  window.SDK.init(normalized.products,config);
  const groups=classify(normalized.products,window.SDK);
  const labels=new Map(groups.flatMap(group=>group.product_ids.map(id=>[id,group.label] as const)));
  for(const item of normalized.products)item.category=labels.get(item.id)||item.category;
  const sourceById=new Map(normalized.products.map(item=>[item.id,item.source_category]));
  for(const group of groups){group.source_categories=[...new Set(group.product_ids.map(id=>sourceById.get(id)))];group.categories=[group.label];}
  window.SDK.init(normalized.products,config);
  const categories:string[]=window.SDK.categories();
  const summary={mode:'imported',fallback:false,product_count:window.SDK.count(),source_category_count:sourceCategories.length,source_categories:sourceCounts,category_count:categories.length,categories:categories.map(name=>({name,count:window.SDK.list().filter({category:name}).count()})),main_categories:groups,needs_secondary_classification:groups.length<5,image_cdn:normalized.base||null,needs_image_cdn:!normalized.base&&normalized.products.some(item=>[item.main_image,...item.images].some(path=>path&&!/^(?:https?:)?\/\//i.test(path))),image_resolution:'render-time only: storeData.imageUrl(path)',source_sha256:fingerprint,missing_images:normalized.products.filter(item=>!item.main_image).length,config_defaults:config};
  const compact=()=>({...summary,source_categories:summary.source_categories.slice(offset,offset+limit),category_page,categories:summary.categories.slice(0,200),categories_truncated:summary.source_categories.length>200,main_categories:groups.map(group=>({id:group.id,label:group.label,count:group.count,image:group.image,source_category_count:group.source_categories?.length||0,sample_product_ids:group.product_ids.slice(0,3),filter_source:'SDK.categories(group.label).result()'}))});
  if(input.action==='inspect')return{...compact(),written:[]};
  const renderHelper = `window.productImageUrl = function (value) {
    if (value == null || value === '') return '';
    const path = String(value).trim();
    if (/^(?:https?:)?\\/\\//i.test(path)) {
      const url = new URL(path.startsWith('//') ? 'https:' + path : path);
      return url.username || url.password ? '' : url.href;
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.includes('\\\\')) return '';
    const configured = (window.commerceConfig && window.commerceConfig.imageCdn) || ${JSON.stringify(normalized.base||'')};
    if (!configured) return '';
    const base = new URL(configured);
    if (!/^https?:$/.test(base.protocol) || base.username || base.password) return '';
    if (!base.pathname.endsWith('/')) base.pathname += '/';
    return new URL(path.replace(/^\\/+/, ''), base).href;
  };`;
  const files=[{path:'js/data.js',content:await formatSource('js/data.js',`window.productData = ${JSON.stringify(normalized.products,(key,value)=>['__proto__','constructor','prototype'].includes(key)?undefined:value,2)};\nwindow.catalogGroups = ${JSON.stringify(groups,null,2)};\n${renderHelper}\nwindow.storeData = { getAll:()=>window.SDK.list().result(), getById:id=>window.SDK.get(String(id)), getByCategory:category=>window.SDK.categories(category).result(), formatPrice:value=>window.SDK.price(value), imageUrl:value=>window.productImageUrl(value), toCartItem:product=>({id:product.id,name:product.name,image:product.main_image,price:product.final_price}) };\n`)}];
  const runtime=await commerceAssets(view.directory,skillRoot);
  files.push(...runtime.files);
  files.push({path:'website-builder.import.json',content:JSON.stringify({...summary,schema:'sdk-import-v2',runtime_data_sha256:createHash('sha256').update(files[0].content).digest('hex'),source:input.file_path||'provided-json',field_map:input.field_map||{},category_map:mapping||{}},null,2)});
  await store.write(input.thread_id,files);
  return {...compact(),written:files.map(file=>file.path),app_required:runtime.appRequired,note:'SDK.category/categories/filter返回二次分类，source_category保留原类；图片字段保留相对路径，只有渲染时调用storeData.imageUrl拼接CDN。数据导入仅准备data.js及缺失sdk.js，不生成app.js；主建站技能按所选模板和站点design生成app.js并合并config_defaults。顺序sdk.js→data.js→app.js，SDK.init只在app.js。已有自定义SDK/app保留。'};
}
