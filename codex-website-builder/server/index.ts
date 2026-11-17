import { readFile } from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// GitLab 暂停：import {ResourceTemplate} from '@modelcontextprotocol/sdk/server/mcp.js';
// GitLab 暂停：import {randomUUID} from 'node:crypto';
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
import { dataPaths } from './data-paths';
import { projectManager } from './project-manager';
// GitLab 暂停：import {PluginSettings,settingNames} from './plugin-settings';
// GitLab 暂停：import {testGitLabConnection} from './gitlab-diagnostics';
// GitLab 暂停：import {GitLabWorkflow} from './gitlab-workflow';
// GitLab 暂停：import {registerGitLabTools} from './gitlab-tools';
// GitLab 暂停：import {registerNativeSettings,settingsCapability} from './native-settings';

import {R2Settings,registerR2Settings,r2SettingsCapability as settingsCapability} from './r2-settings';
import {R2Deployment} from './r2-deployment';
import {openPreviewBrowser} from './open-browser';

const uri = 'ui://codex-website-builder/canvas';
const sidebarIcon = await readFile(new URL('../../assets/icon.png', import.meta.url));
const html = await readFile(new URL('../ui/index.html', import.meta.url), 'utf8');
const paths = dataPaths();
const projects = new ProjectStore(paths.project);
// GitLab 配置与部署流程暂时注释保留。
// const settings=new PluginSettings(paths.root,paths.project);
// await settings.get();
// const gitlab=new GitLabWorkflow(projects,settings);
// let openNativeSettings:()=>Promise<unknown>;
// const control=async(input:any)=>{
//  if(input.type==='panel'){
//   if(!['settings','deploy'].includes(input.view))throw Error('未知独立面板');
//   if(input.view==='deploy'){const panel=projects.database.panelById(input.panel_id);if(!panel||panel.project_id!==input.project_id||input.thread_id&&panel.thread_id!==input.thread_id)throw Error('发布面板不属于当前项目');}
//   const key=randomUUID();projects.database.sql.prepare('INSERT INTO settings VALUES (?,?)').run('modal:'+key,JSON.stringify({view:input.view,project_id:input.project_id,panel_id:input.panel_id,thread_id:input.thread_id,expires:Date.now()+600000}));
//   return {resource_uri:'ui://codex-website-builder/panel/'+key};
//  }
//  if(input.type==='settings'){
//   if(input.action==='open')return openNativeSettings();
//   if(input.action==='get')return settings.public();
//   if(input.action==='test'){
//    const config=await settings.get(false);for(const name of settingNames){const value=input.values?.[name];if(typeof value==='string')config[name]=name==='GITLAB_TOKEN'?value:value.trim();}
//    if(input.clear_token)config.GITLAB_TOKEN='';config.GITLAB_DEFAULT_BRANCH ||= 'main';
//    return testGitLabConnection(config);
//   }
//   if(input.action==='save'){if(projects.database.sql.prepare('SELECT owner FROM deployment_locks WHERE expires_at>?').get(Date.now()))throw Error('部署期间不能更改配置，请先完成或取消');return settings.save(input.values||{});}
//   throw Error('未知配置操作');
//  }
//  const panel=projects.database.panelById(input.panel_id);
//  if(!panel||panel.project_id!==input.project_id||input.thread_id&&panel.thread_id!==input.thread_id)throw Error('部署请求不属于当前项目面板');
//  const actor='ui:'+input.panel_id;
//  if(input.action==='status')return gitlab.status(input.project_id);
//  if(input.action==='cancel')return gitlab.cancel(input.project_id,actor,input.confirmation_id);
//  if(input.action==='prepare')return gitlab.prepare({project_id:input.project_id,actor,intent:'deploy',domain:input.domain,environment:input.environment});
//  if(input.action==='execute')return gitlab.execute(input.confirmation_id,actor,input.decision,'deploy',input.project_id);
//  throw Error('未知部署操作');
// };
//
const r2Settings=new R2Settings(paths.root);
const r2=new R2Deployment(projects,r2Settings);
const control=async(input:any)=>{
 if(input.type!=='r2')throw Error('Website Builder GitLab 配置/部署入口暂时停用');
 const panel=projects.database.panelById(input.panel_id);
 if(!panel||panel.project_id!==input.project_id||input.thread_id&&panel.thread_id!==input.thread_id)throw Error('部署请求不属于当前项目面板');
 const actor='ui:'+input.panel_id;
 if(input.action==='status')return r2.status(input.project_id);
 if(input.action==='start')return r2.start(input.project_id,actor);
 if(input.action==='cancel')return r2.cancel(input.project_id,actor);
 if(input.action==='preview'){const state=r2.status(input.project_id);if(state.status!=='completed'||!state.url)throw Error('项目尚未部署完成');return openPreviewBrowser(state.url);}
 throw Error('未知 R2 操作');
};
const manager = projectManager(projects);
const syncProject = projectService(projects);
const preview = await createPreview(html, paths.reference, 'www.noventrad.com', syncProject, manager.run,control);
const skillRoot = (process.env.WEBSITE_BUILDER_SKILL_ROOT || resolve('skills/website-builder')).replaceAll('${PLUGIN_ROOT}',fileURLToPath(new URL('../../',import.meta.url)));
const server = new McpServer({ name: 'codex-website-builder', version: '0.8.9', icons: [{ src: `data:image/png;base64,${sidebarIcon.toString('base64')}`, mimeType: 'image/png', sizes: ['200x200'] }] },{capabilities:{experimental:{'openai/settings':settingsCapability}}});
const csp = { connectDomains: ['data:', 'blob:'], resourceDomains: ['data:', 'blob:'], frameDomains: ['blob:', 'data:'], baseUriDomains: ['https://website-builder.invalid'] };
const legacyCsp = { connect_domains: csp.connectDomains, resource_domains: csp.resourceDomains, frame_domains: csp.frameDomains, base_uri_domains: csp.baseUriDomains };
// const panelContent=(resourceUri:string,context:unknown)=>({contents:[{uri:resourceUri,mimeType:RESOURCE_MIME_TYPE,text:preview.render().replace('</head>',`<script>window.__WEBSITE_PANEL_CONTEXT__=${JSON.stringify(context).replaceAll('<','\\u003c')}</script></head>`),_meta:{ui:{csp},'openai/widgetCSP':legacyCsp}}]});
// server.registerResource('independent-panel',new ResourceTemplate('ui://codex-website-builder/panel/{token}',{list:undefined}),{mimeType:RESOURCE_MIME_TYPE,_meta:{ui:{csp}}},async(resourceUri,variables)=>{
//  const row=projects.database.sql.prepare('SELECT value FROM settings WHERE key=?').get('modal:'+variables.token) as any;
//  const context=row?JSON.parse(row.value):null;if(!context||context.expires<Date.now())throw Error('面板请求已失效，请重新打开');
//  return panelContent(resourceUri.href,context);
// });
// openNativeSettings=registerNativeSettings(server,settings,values=>control({type:'settings',action:'save',values}),values=>control({type:'settings',action:'test',values}));
//
registerR2Settings(server,r2Settings);
registerAppResource(server, 'canvas', uri, { _meta: { ui: { csp }, 'openai/widgetCSP': legacyCsp } }, async () => ({
  contents: [{ uri, mimeType: RESOURCE_MIME_TYPE, text: preview.render(), _meta: {
    ui: { csp, permissions:{clipboardWrite:{}} },
    'openai/widgetCSP': legacyCsp,
    'openai/ui': { preferredDisplayMode: 'fullscreen', availableDisplayModes: ['fullscreen'] },
  } }],
}));
registerAppTool(server, 'open_canvas', {
  title: 'Website Builder',
  description: '打开网站生成与实时预览画布。面板首页submission创建项目后必须在新对话调用open_thread_canvas(thread_id)一次打开侧边UI进入详情；会话途中允许传真实thread_id重新打开UI并进入该会话已绑定项目详情，不重建项目。Codex对话需求先创建空项目（不传pages），再传真实thread_id打开一次画布进入详情，然后才plan和生成内容；没有会话绑定项目时进入首页，不使用全局最近项目。建站、改页或重生成时先使用内置website-builder SKILL；仅用户明确选择网站目录时展示参考站点。',
  inputSchema: {thread_id:z.string().optional()},
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  _meta: { ui: { resourceUri: uri }, 'openai/ui': { entrypoints: [{ type: 'global' }] } },
}, async input => ({ content: [{ type: 'text', text: '网站展示画布已打开。' }],structuredContent:{canvas_launch:{scope:input.thread_id?'thread':'global',thread_id:input.thread_id||process.env.CODEX_THREAD_ID||process.env.CODEX_SESSION_ID||null}} }));
registerAppTool(server,'open_thread_canvas',{
  title:'Website Builder',
  description:'在当前对话内打开 Website Builder。首页新建任务统一开启新对话并立即提交需求及附件；供对话内插件入口使用，会话途中允许再次打开并恢复当前会话项目详情，避免无谓自动重复打开。可传真实thread_id以定位从面板创建的新对话。',
  inputSchema:{thread_id:z.string().optional()},
  annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false},
  _meta:{ui:{resourceUri:uri},'openai/ui':{entrypoints:[{type:'thread'}]}},
},async input=>({content:[{type:'text',text:'当前对话的网站画布已打开。'}],structuredContent:{canvas_launch:{scope:'thread',thread_id:input.thread_id||process.env.CODEX_THREAD_ID||process.env.CODEX_SESSION_ID||null}}}));
server.registerTool('website_panel_context', {
  description: '查询当前真实会话的 Website Builder 面板位置。新建网站需求先传requirement=用户需求完整原文，后台匹配待处理UI提交并返回submission（panel_id/request_id），无需在用户消息中显示技术说明。多条相同提交返回submission_ambiguous，禁止任意选择。详情页返回project_id，多个面板传panel_id精确查询；不得用全局最近项目替代。',
  inputSchema: { thread_id: z.string().optional(), panel_id: z.string().optional(), requirement:z.string().max(100000).optional() },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
}, async input => { try { const value=await manager.run({...input,action:'context'});return {content:[{type:'text',text:JSON.stringify(value)}]}; } catch(error) { return {isError:true,content:[{type:'text',text:(error as Error).message}]}; } });
server.registerTool('website_projects', {
  description: '管理全局 SQLite 项目：list 列出项目，open/create 绑定当前会话和面板，home 返回主界面，delete 软删除（保留文件），resources 列出资源，attach 复制用户明确提供的图片/文件到项目资源目录。panel_id 来自面板上下文；thread_id 必须是真实当前会话 ID。首页submission用create与request_id创建空项目，随后必须调用open_thread_canvas(thread_id=新对话ID)一次打开侧边UI进入详情，查询submission到chat_detail_ready=true后再规划页面和生成；会话途中可按需open_canvas(thread_id)恢复同一项目详情。',
  inputSchema: { action:z.enum(['list','resume','open','create','bind','home','delete','restore','resources','attach','folder','images','capture','submission']).default('list'), visible_panel_id:z.string().optional(),requirement:z.string().max(100000).optional(),request_id:z.string().max(128).optional(),submission_start:z.boolean().optional(),detail_ready:z.boolean().optional(),cancel:z.boolean().optional(),panel_id:z.string().optional(),thread_id:z.string().optional(),project_id:z.string().optional(),name:z.string().max(200).optional(),country:z.string().trim().max(100).optional(),language:z.string().trim().max(100).optional(),categories:z.array(z.string().trim().min(1).max(100)).max(2).optional(),brand:z.string().trim().max(200).optional(),source_path:z.string().optional(),path:z.string().optional(),width:z.number().int().min(320).max(2560).optional(),capture_id:z.string().optional(),chunk:z.string().max(512000).optional(),offset:z.number().int().nonnegative().optional(),final:z.boolean().optional() },
  annotations: { readOnlyHint:false,destructiveHint:false,openWorldHint:true },
}, async input => { try {const value=await manager.run(input);return {content:[{type:'text',text:JSON.stringify(value)}],_meta:{manager:value}};} catch(error) {return {isError:true,content:[{type:'text',text:(error as Error).message}]};} });
server.registerTool('website_images', {
  description:'Track generated website images. Before imagegen register a filename relative to material_directory, e.g. logo.png/favicon.png/banner1.png/about.png, with begin and actual dimensions; after copying the final image to material_directory call finish; it compresses through the bundled image-generator JS script (TinyPNG), at most three total attempts per begin, then atomically publishes to source_directory/images; material originals remain unchanged. Compression failures preserve any previous website image and require a new begin after exhausting the budget. Existing filenames may be regenerated; archive originals under material/history first. Call fail with an honest reason if generation fails. Persistent UI placeholders update automatically when files arrive. Only the current thread project is allowed; never write fake placeholder image files.',
  inputSchema:{thread_id:z.string(),project_id:z.string(),action:z.enum(['begin','finish','fail']),path:z.string(),name:z.string().max(200).optional(),width:z.number().int().min(1).max(32768).optional(),height:z.number().int().min(1).max(32768).optional(),error:z.string().max(1000).optional()},
  annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:true},
},async input=>{try{return{content:[{type:'text',text:JSON.stringify(await manager.imageTask(input))}]};}catch(error){return{isError:true,content:[{type:'text',text:(error as Error).message}]};}});
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
  description:'Use the bundled skill and reuse the exact thread project. Create/open an empty project BEFORE planning pages or generating content. For a panel submission use website_projects(create,panel_id,request_id), then call open_thread_canvas with the NEW real thread_id once to open its sidebar and wait for submission chat_detail_ready=true before generating. The originating panel does not replace the new chat sidebar. Never create a replacement project. For chat requests create/open without pages, open_canvas once to enter details, THEN plan and generate. For a complete ecommerce site, explicitly plan home/shop/product/wishlist/checkout/login/register/about/contact/terms/privacy/return, Default to a shared drawer cart (no cart.html); include cart.html only for an explicit page-cart request or preserved existing page mode. Default to the chosen Home chain; excluding Header/Footer, generation permits at most 0–2 justified composition changes and N±1 main sections. Preserve independent component source structures; this is not an acceptance or readiness gate. Logo must be a transparent, tightly cropped brand wordmark image, favicon square. Fonts and third-party dependencies must use online CDN URLs. Implement project WebComponent Toast from the toast-01 template document before writing pages; the assembler only reuses that supplied component; overlay closing is a per-component documentation requirement, without a unified Overlay API. Product JSON must go through website_products/SDK. Avoid jsDelivr CDN; page-specific logic stays in inline script. never use browser alert. Avoid home categories when Header already provides category navigation. mobile html root font-size is 12px. Do not silently reduce a complete site to transaction pages. Existing custom names or partial user requests may differ. Header must include working Home, Shop, About Us and Contact Us links on desktop and mobile. Projects have project_directory containing README.md, src/, material/ and a local Git repository initialized and first committed on main without a remote. End every creation/modification round (including images/README-only changes) with finish to commit locally to main; no changes means no empty commit, never push. GIT_CONFIRMATION_REQUIRED means ask the user first, then use system Git for approved merge/branch/conflict handling; never auto-repair or bypass confirmation. directory/source_directory is src; source paths are relative to src, no src prefix. Generated originals go in material_directory, final website assets in src/images with fixed semantic filenames. Never migrate legacy formats automatically. The returned directory is production-only; keep drafts, reports and raw sources in metadata_directory. Plan missing pages, begin before edits, finish after complete files; finish without paths validates all unfinished planned pages and settles their status before ending the task. New projects require new_project=true.',
  inputSchema:{action:z.enum(['open','plan','begin','finish','status']).default('open'),thread_id:z.string().min(1),project_id:z.string().optional(),new_project:z.boolean().optional(),name:z.string().optional(),country:z.string().trim().max(100).optional(),categories:z.array(z.string().trim().min(1).max(100)).max(2).optional(),brand:z.string().trim().max(200).optional(),brief:z.string().optional(),language:z.string().optional(),pages:z.array(pageSchema).min(1).optional(),paths:z.array(z.string()).optional()},
  annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:false},
},async input=>{
  try {
    let view;
    if(input.action==='open')view=await projects.open({threadId:input.thread_id,projectId:input.project_id,newProject:input.new_project,name:input.name,brief:input.brief,country:input.country,categories:input.categories,brand:input.brand,language:input.language,pages:input.pages??(input.new_project?[]:undefined)});
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
  description:'Write a completed page to disk immediately before generating the next page. Multiple HTML files and shared dependencies are accepted in one request, including batch imports. Save newly generated pages as soon as each is finished. Local vendored Prettier standalone formats HTML/inline scripts/styles/JS/CSS/JSON before atomic save; no npm dependency. Do not defer all pages into one batch. Source paths are relative to src (directory); README.md is the sole root-document exception and writes project_directory/README.md. Never add temporary files, raw sources or reports to directory. website-builder.*.json records are routed to metadata_directory outside production; screenshots also live there. HTML fragment=true adds shared boilerplate and detects prepared commerce SDKs. JS/JSON syntax errors do not overwrite existing files. Submitted HTML and affected pages validate automatically even with finalize_pages: []; passing pages immediately become ready for UI sync. finalize_pages adds extra pages to validate. Never use for reference website files.',
  inputSchema:{thread_id:z.string(),project_id:z.string(),files:z.array(z.object({path:z.string(),content:z.string(),fragment:z.boolean().optional(),title:z.string().optional()})).min(1),finalize_pages:z.array(z.string()).optional()},
  annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:false},
},async input=>{
  try{const current=await projects.get(input.thread_id);if(current?.project.id!==input.project_id)throw new Error('会话项目不匹配，请重新打开项目');const view=await projects.write(input.thread_id,input.files,input.finalize_pages);return{content:[{type:'text',text:JSON.stringify(compactProject(view))}]};}
  catch(error){return{isError:true,content:[{type:'text',text:(error as Error).message}]};}
});
server.registerTool('website_templates',{
  description:'Plan a coherent site visual system first. Shop/About selection must compare at least 3 candidates and actual region differences; candidate usage reports past projects so compatible less-used templates can be preferred for new sites. Select returns unranked candidates; Agent chooses templates, palette, light/dark strategy and content widths. Home templates return composition documentation only (their code is pseudocode), with replaceable Header/Footer and generation-only limits of 0–2 main-section changes and source N±1 sections; independent template code includes Overview/source; optional targets/bind record provenance only. Fidelity is SKILL guidance, never a readiness gate; legacy audit returns source info without scores. New components use unique xxx-component names. Prefer a shared drawer; use cart.html only for explicit page-cart requirements or preserved existing page mode, never both. Inspect actual site rendering and interactions.',
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
  description: 'Prepare mock product data and bundled APP/SDK assets once per project, or validate data. Install only the unified SDK and data; never generate app.js in this data tool. Return config_defaults so website-builder generates app.js with the selected templates/theme. One sdk.js provides SDK and APP; load sdk.js -> data.js -> app.js -> components. app.js owns configuration and the only SDK.init, with synchronous static-data initialization before components and explicit async readiness; do not create another configuration script. Preserve existing data/SDK/config; API sources skip mock generation. Mock generation belongs to the website-mock-data skill; use that skill, not the main skill, for sample generation.',
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
  description:'Read user-provided product JSON or an explicit JSON file through the bundled sdk.js adapter. Do not read raw product files into model context. Reports source and SDK category counts. Too many source categories require a complete semantic category_map (or consistent parent categories), then SDK category fields expose the regrouped taxonomy. classification_required means continue classification, not Mock. Image fields remain relative; rendering explicitly calls storeData.imageUrl to join website_domain -> https://cdn.<domain>/path. Original JSON is unchanged. Source-category summaries support category_offset/category_limit paging. import writes normalized runtime data; inspect writes nothing. Unrecognized data returns mode=mock,next_skill=website-mock-data without replacing existing data. Keep source JSON outside production.',
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
  inputSchema:{metadata_only:z.boolean().optional(),page_limit:z.number().int().min(1).max(10).optional(),priority_path:z.string().optional(),since:z.string().optional(),known:z.record(z.string(),z.number()).optional(),thread_id:z.string().optional(),project_id:z.string().optional(),wait_ms:z.number().int().min(0).max(20000).default(20000)},
  annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false},_meta:{ui:{visibility:['app']}},
},async input=>{try{return{content:[],_meta:{sync:await syncProject({metadataOnly:input.metadata_only,pageLimit:input.page_limit,priorityPath:input.priority_path,since:input.since,known:input.known,threadId:input.thread_id,projectId:input.project_id,waitMs:input.wait_ms})}};}catch(error){return{isError:true,content:[{type:'text',text:(error as Error).message}]};}});
// GitLab 暂停：registerGitLabTools(server,gitlab,projects);
// GitLab 暂停：server.registerTool('website_control',{description:'UI-only plugin configuration and deployment dialogs; settings fields are visible only to the app; redact credentials from diagnostics.',inputSchema:{type:z.enum(['settings','deploy','panel']),action:z.enum(['get','save','test','status','prepare','execute','cancel','open']),view:z.enum(['settings','deploy']).optional(),panel_id:z.string().optional(),thread_id:z.string().optional(),project_id:z.string().optional(),values:z.record(z.string(),z.string()).optional(),clear_token:z.boolean().optional(),domain:z.string().optional(),environment:z.enum(['test','production']).optional(),confirmation_id:z.string().optional(),decision:z.enum(['confirm','local','cloud']).optional()},annotations:{readOnlyHint:false,destructiveHint:true,openWorldHint:true},_meta:{ui:{visibility:['app']}}},async input=>{try{return{content:[],_meta:{control:await control(input)}};}catch(error){return{isError:true,content:[{type:'text',text:(error as Error).message}]};}});
server.registerTool('website_control',{description:'App-only R2 deployment controls',inputSchema:{type:z.literal('r2'),action:z.enum(['start','status','cancel','preview']),project_id:z.string(),panel_id:z.string(),thread_id:z.string().optional()},annotations:{readOnlyHint:false,destructiveHint:true,openWorldHint:true},_meta:{ui:{visibility:['app']}}},async input=>{try{return {content:[],_meta:{control:await control(input)}};}catch(error){return {isError:true,content:[{type:'text',text:(error as Error).message}]};}});
server.registerTool('website_r2_deploy',{description:'将当前会话项目src精确同步到R2项目ID目录；start覆盖同名文件并删除该前缀内本地不存在的文件，仅用户明确要求部署时调用。status查询进度，cancel取消。成功返回链接，不自动配置DNS/Worker。',inputSchema:{action:z.enum(['start','status','cancel']),thread_id:z.string(),project_id:z.string()},annotations:{readOnlyHint:false,destructiveHint:true,openWorldHint:true}},async input=>{try{if(projects.database.binding(input.thread_id)?.projectId!==input.project_id)throw Error('只能部署当前真实会话绑定项目');const value=input.action==='status'?r2.status(input.project_id):input.action==='cancel'?r2.cancel(input.project_id,input.thread_id):await r2.start(input.project_id,input.thread_id);return {content:[{type:'text',text:JSON.stringify(value)}]};}catch(error){return {isError:true,content:[{type:'text',text:(error as Error).message}]};}});
const shutdown = async () => { preview.service.closeAllConnections(); preview.service.close(); await manager.close(); };
process.once('SIGTERM', () => { void shutdown().finally(()=>process.exit(0)); });
process.once('SIGINT', () => { void shutdown().finally(()=>process.exit(0)); });
if (process.argv.includes('--preview')) {
  console.log(preview.url);
} else {
  const transport = new StdioServerTransport();
  server.server.onclose = () => { void shutdown(); };
  await server.connect(transport);
  process.stdin.once('end', () => { void shutdown(); });
}
