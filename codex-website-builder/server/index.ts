import { readFile } from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { resolve } from 'node:path';
import { createPreview } from './preview';
import { z } from 'zod';
import { gzipSync } from 'node:zlib';
import { ProjectStore } from './projects';
import { compactProject, projectService, previewPayload } from './project-service';
import { readTemplates } from './templates';
import { fileURLToPath } from 'node:url';
import {resourceChunk} from './resource-proxy';
import { prepareCommerce } from './commerce';
import { screenshotPage } from './screenshot';
import { importProducts } from './product-import';

const uri = 'ui://codex-website-builder/canvas';
const html = await readFile(new URL('../ui/index.html', import.meta.url), 'utf8');
const projects = new ProjectStore(process.env.WEBSITE_BUILDER_PROJECT_ROOT || resolve('project'));
const syncProject = projectService(projects);
const preview = await createPreview(html, process.env.WEBSITE_BUILDER_ROOT || resolve('../website'), 'www.noventrad.com', syncProject);
const skillRoot = (process.env.WEBSITE_BUILDER_SKILL_ROOT || resolve('skills/website-builder')).replaceAll('${PLUGIN_ROOT}',fileURLToPath(new URL('../../',import.meta.url)));
const server = new McpServer({ name: 'codex-website-builder', version: '0.7.8' });
const csp = { connectDomains: ['data:', 'blob:'], resourceDomains: ['data:', 'blob:'], frameDomains: ['blob:', 'data:'], baseUriDomains: ['https://website-builder.invalid'] };
const legacyCsp = { connect_domains: csp.connectDomains, resource_domains: csp.resourceDomains, frame_domains: csp.frameDomains, base_uri_domains: csp.baseUriDomains };
registerAppResource(server, 'canvas', uri, { _meta: { ui: { csp }, 'openai/widgetCSP': legacyCsp } }, async () => ({
  contents: [{ uri, mimeType: RESOURCE_MIME_TYPE, text: preview.render(), _meta: {
    ui: { csp },
    'openai/widgetCSP': legacyCsp,
    'openai/ui': { preferredDisplayMode: 'fullscreen', availableDisplayModes: ['fullscreen'] },
  } }],
}));
registerAppTool(server, 'open_canvas', {
  title: 'Website Builder',
  description: '打开网站生成与实时预览画布。没有打开项目时画布为空。建站、改页或重生成时先使用内置 website-builder SKILL，以 website_project 复用当前会话项目；仅用户明确选择网站目录时展示参考站点。',
  inputSchema: {},
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  _meta: { ui: { resourceUri: uri }, 'openai/ui': { entrypoints: [{ type: 'global' }] } },
}, async () => ({ content: [{ type: 'text', text: '网站展示画布已打开。' }] }));
server.registerTool('read_website', {
  description: '读取配置根目录内的网站页面与内嵌资源，仅供画布 UI 使用。',
  inputSchema: { directory: z.string().default('www.noventrad.com') },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  _meta: { ui: { visibility: ['app'] } },
}, async ({ directory }) => {
  try { return { content: [{ type: 'text', text: '网站页面已读取。' }], _meta: { website: await preview.readWebsite(directory, false) } }; }
  catch (error) { return { isError: true, content: [{ type: 'text', text: (error as Error).message }] }; }
});
server.registerTool('proxy_resource',{
 description:'UI-only external resource proxy. Backend fetches HTTP(S) resources, resolves CSS/module dependencies and returns bounded binary chunks. Never copy resource payloads into model context.',
 inputSchema:{url:z.string().url(),offset:z.number().int().min(0).default(0),raw:z.boolean().default(false)},
 annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:true},_meta:{ui:{visibility:['app']}},
},async({url,offset,raw})=>{try{return{content:[],_meta:{resource:await resourceChunk(url,offset,raw)}};}catch(error){return{isError:true,content:[{type:'text',text:(error as Error).message}]};}});
server.registerTool('read_page', {
  description: '读取单个页面及其内嵌资源，以 gzip 传输给画布，不通过 HTTP 获取本地资源。',
  inputSchema: { directory: z.string(), path: z.string() },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  _meta: { ui: { visibility: ['app'] } },
}, async ({ directory, path }) => {
  try { return { content: [{ type: 'text', text: '页面预览已读取。' }], _meta: { gzip: previewPayload(gzipSync(await preview.readPage(directory,path)).toString('base64')) } }; }
  catch(error) { return { isError: true, content: [{ type:'text', text:(error as Error).message }] }; }
});
const pageSchema=z.object({path:z.string(),title:z.string()});
server.registerTool('website_project',{
  title:'Website Builder',
  description:'Use the bundled skill and reuse the exact thread project. For a complete ecommerce site, explicitly plan home/shop/product/wishlist/checkout/login/register/about/contact/terms/privacy/return, Default to a shared drawer cart (no cart.html); include cart.html only for an explicit page-cart request or preserved existing page mode. Complete homepages need 1–2 distinct additional sections beyond header/footer/hero/product list. Logo must be a transparent, tightly cropped brand wordmark image, favicon square. Fonts and third-party dependencies must use online CDN URLs. Every HTML page receives WebComponent Toast support; overlay closing is a per-component documentation requirement, without a unified Overlay API. Product JSON must go through website_products/SDK. Avoid jsDelivr CDN; page-specific logic stays in inline script. never use browser alert. Avoid home categories when Header already provides category navigation. mobile html root font-size is 12px. Do not silently reduce a complete site to transaction pages. Existing custom names or partial user requests may differ. Header must include working Home, Shop, About Us and Contact Us links on desktop and mobile. The returned directory is production-only; keep drafts, reports and raw sources in metadata_directory. Plan missing pages, begin before edits, finish after complete files; finish without paths validates all unfinished planned pages and settles their status before ending the task. New projects require new_project=true.',
  inputSchema:{action:z.enum(['open','plan','begin','finish','status']).default('open'),thread_id:z.string().min(1),project_id:z.string().optional(),new_project:z.boolean().optional(),name:z.string().optional(),brief:z.string().optional(),language:z.string().optional(),pages:z.array(pageSchema).min(1).optional(),paths:z.array(z.string()).optional()},
  annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:false},
},async input=>{
  try {
    let view;
    if(input.action==='open')view=await projects.open({threadId:input.thread_id,projectId:input.project_id,newProject:input.new_project,name:input.name,brief:input.brief,language:input.language,pages:input.pages});
    else {
      const current=await projects.get(input.thread_id);if(!current)throw new Error('请先打开当前会话项目');
      if(input.project_id&&input.project_id!==current.project.id)throw new Error('会话项目已切换，不能继续修改旧项目');
      if(input.action==='plan')view=await projects.plan(input.thread_id,input.pages||[]);
      else if(input.action==='begin')view=await projects.begin(input.thread_id,input.paths||[]);
      else if(input.action==='finish')view=await projects.finish(input.thread_id,input.paths||[]);
      else view=await projects.reconcile(input.thread_id)||current;
    }
    return{content:[{type:'text',text:JSON.stringify(compactProject(view))}],_meta:{workspaceThread:input.thread_id}};
  }catch(error){return{isError:true,content:[{type:'text',text:(error as Error).message}]};}
});
server.registerTool('website_write',{
  description:'Write a completed page to disk immediately before generating the next page. Multiple HTML files and shared dependencies are accepted in one request, including batch imports. Save newly generated pages as soon as each is finished. Local vendored Prettier standalone formats HTML/inline scripts/styles/JS/CSS/JSON before atomic save; no npm dependency. Do not defer all pages into one batch. Never add temporary files, raw sources or reports to directory. website-builder.*.json records are routed to metadata_directory outside production; screenshots also live there. HTML fragment=true adds shared boilerplate and detects prepared commerce SDKs. JS/JSON syntax errors do not overwrite existing files. Submitted HTML and affected pages validate automatically even with finalize_pages: []; passing pages immediately become ready for UI sync. finalize_pages adds extra pages to validate. Never use for reference website files.',
  inputSchema:{thread_id:z.string(),project_id:z.string(),files:z.array(z.object({path:z.string(),content:z.string(),fragment:z.boolean().optional(),title:z.string().optional()})).min(1),finalize_pages:z.array(z.string()).optional()},
  annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:false},
},async input=>{
  try{const current=await projects.get(input.thread_id);if(current?.project.id!==input.project_id)throw new Error('会话项目不匹配，请重新打开项目');const view=await projects.write(input.thread_id,input.files,input.finalize_pages);return{content:[{type:'text',text:JSON.stringify(compactProject(view))}]};}
  catch(error){return{isError:true,content:[{type:'text',text:(error as Error).message}]};}
});
server.registerTool('website_templates',{
  description:'Plan a coherent site visual system first. Shop/About selection must compare at least 3 candidates and actual region differences; candidate usage reports past projects so compatible less-used templates can be preferred for new sites. Select returns unranked candidates; Agent chooses templates, palette, light/dark strategy and content widths. Code includes Overview/source; optional targets/bind record provenance only. Fidelity is SKILL guidance, never a readiness gate; legacy audit returns source info without scores. New components use unique xxx-component names. Prefer a shared drawer; use cart.html only for explicit page-cart requirements or preserved existing page mode, never both. Inspect actual site rendering and interactions.',
  inputSchema:{mode:z.enum(['select','summary','doc','code','bind','audit']).default('select'),ids:z.array(z.string()).max(12).optional(),category:z.string().optional(),brief:z.string().optional(),section:z.enum(['html','js','css','all']).optional(),
    thread_id:z.string().optional(),project_id:z.string().optional(),targets:z.array(z.object({file:z.string(),region:z.string(),id:z.string(),baseline:z.enum(['html','render']).optional()})).max(12).optional()},
  annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:false},
},async input=>{try{
  if(input.mode==='bind'||input.mode==='audit'||input.targets?.length){
    if(!['code','bind','audit'].includes(input.mode))throw new Error('targets 仅用于 code/bind');
    if(!input.thread_id||!input.project_id)throw new Error('绑定/验收需要真实 thread_id 和 project_id');
    const current=await projects.get(input.thread_id);if(!current||current.project.id!==input.project_id)throw new Error('会话项目不匹配');
    if(input.mode==='audit')return{content:[{type:'text',text:JSON.stringify(await projects.auditTemplates(input.thread_id))}]};
    if(!input.targets?.length)throw new Error('请提供模板 targets');
    const binding=await projects.bindTemplates(input.thread_id,input.targets);
    if(input.mode==='bind')return{content:[{type:'text',text:JSON.stringify(binding)}]};
    if(input.mode!=='code')throw new Error('targets 仅用于 code/bind');
    const result=await readTemplates(skillRoot,{...input,mode:'code',ids:[...new Set(input.targets.map(target=>target.id))],section:'all'});
    return{content:[{type:'text',text:JSON.stringify({templates:result,binding})}]};
  }
  return{content:[{type:'text',text:JSON.stringify(await readTemplates(skillRoot,{...input,usage:input.mode==='select'?await projects.templateUsage():undefined} as Parameters<typeof readTemplates>[1]))}]};
}catch(error){return{isError:true,content:[{type:'text',text:(error as Error).message}]};}});
server.registerTool('website_commerce', {
  description: 'Prepare mock product data and bundled APP/SDK assets once per project, or validate data. New commerce configuration lives in js/app.js; do not create commerce-config.js. Preserve existing data/SDK/config; API sources skip mock generation. Mock generation belongs to the generate-mock-data skill; use that skill, not the main skill, for sample generation.',
  inputSchema: {
    action: z.enum(['prepare', 'validate']).default('prepare'),
    thread_id: z.string().min(1), project_id: z.string(),
    count: z.number().int().min(1).max(200).optional(), seed: z.string().optional(),
    currency: z.string().optional(), locale: z.string().optional(),
    products: z.array(z.record(z.string(), z.unknown())).optional(),
    api_url: z.string().url().optional(), regenerate: z.boolean().default(false),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
}, async input => {
  try { return { content: [{ type: 'text', text: JSON.stringify(await prepareCommerce(projects, skillRoot, input)) }] }; }
  catch (error) { return { isError: true, content: [{ type: 'text', text: (error as Error).message }] }; }
});
server.registerTool('website_products',{
  description:'Read user-provided product JSON or an explicit JSON file through the bundled sdk.js adapter. Do not read raw product files into model context. Reports source and SDK category counts. Too many source categories require a complete semantic category_map (or consistent parent categories), then SDK category fields expose the regrouped taxonomy. classification_required means continue classification, not Mock. Image fields remain relative; rendering explicitly calls storeData.imageUrl to join website_domain -> https://cdn.<domain>/path. Original JSON is unchanged. Source-category summaries support category_offset/category_limit paging. import writes normalized runtime data; inspect writes nothing. Unrecognized data returns mode=mock,next_skill=generate-mock-data without replacing existing data. Keep source JSON outside production.',
  inputSchema:{thread_id:z.string(),project_id:z.string(),action:z.enum(['inspect','import']).default('import'),file_path:z.string().optional(),source_json:z.string().optional(),website_domain:z.string().optional(),image_cdn:z.string().optional(),currency:z.string().optional(),locale:z.string().optional(),field_map:z.record(z.string(),z.string()).optional(),category_map:z.record(z.string(),z.string()).optional(),category_offset:z.number().int().min(0).optional(),category_limit:z.number().int().min(1).max(200).optional()},
  annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:false},
},async input=>{try{return{content:[{type:'text' as const,text:JSON.stringify(await importProducts(projects,skillRoot,input))}]};}catch(error){return{isError:true,content:[{type:'text' as const,text:(error as Error).message}]};}});
server.registerTool('website_screenshot', {
  description:'Return a named project page as a complete full-page PNG, after load, async window.websiteReady, fonts, image decoding, lazy loading and stable layout. Fails on broken assets, script errors or timeout; never captures the canvas thumbnail. Chrome must be installed.',
  inputSchema:{thread_id:z.string().min(1),project_id:z.string(),path:z.string(),width:z.number().int().min(320).max(2560).default(1280)},
  annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:true},
},async input=>{try{const result=await screenshotPage(projects,input);return{content:[{type:'text' as const,text:JSON.stringify({path:result.path,page:result.page,width:result.width,fullPage:true})},{type:'image' as const,mimeType:'image/png',data:result.bytes.toString('base64')}]};}catch(error){return{isError:true,content:[{type:'text' as const,text:(error as Error).message}]};}});
server.registerTool('project_sync',{
  description:'UI-only long poll: return project state and changed ready-page payloads; no full-site reload or model context.',
  inputSchema:{since:z.string().optional(),known:z.record(z.string(),z.number()).optional(),thread_id:z.string().optional(),wait_ms:z.number().int().min(0).max(20000).default(20000)},
  annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false},_meta:{ui:{visibility:['app']}},
},async input=>{try{return{content:[],_meta:{sync:await syncProject({since:input.since,known:input.known,threadId:input.thread_id,waitMs:input.wait_ms})}};}catch(error){return{isError:true,content:[{type:'text',text:(error as Error).message}]};}});
if (process.argv.includes('--preview')) {
  console.log(preview.url);
} else {
  const transport = new StdioServerTransport();
  server.server.onclose = () => { preview.service.closeAllConnections(); preview.service.close(); };
  await server.connect(transport);
  process.stdin.once('end', () => { preview.service.closeAllConnections(); preview.service.close(); });
}
