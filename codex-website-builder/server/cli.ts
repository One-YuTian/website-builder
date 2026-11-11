import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { ProjectStore } from './projects';
import { compactProject } from './project-service';
import { readTemplates } from './templates';
import { prepareCommerce } from './commerce';
import { screenshotPage } from './screenshot';
import { importProducts } from './product-import';

try {
  let text='';for await(const chunk of process.stdin)text+=chunk;
  const input=JSON.parse(text);
  const config=JSON.parse(await readFile(new URL('../../mcp.json',import.meta.url),'utf8')).mcpServers['website-builder'].env||{};
  const store=new ProjectStore(process.env.WEBSITE_BUILDER_PROJECT_ROOT||config.WEBSITE_BUILDER_PROJECT_ROOT||fileURLToPath(new URL('../../project/',import.meta.url)));
  const thread=input.thread_id||process.env.CODEX_THREAD_ID||process.env.CODEX_SESSION_ID;
  const skillRoot=(process.env.WEBSITE_BUILDER_SKILL_ROOT||config.WEBSITE_BUILDER_SKILL_ROOT||fileURLToPath(new URL('../../skills/website-builder/',import.meta.url))).replaceAll('${PLUGIN_ROOT}',fileURLToPath(new URL('../../',import.meta.url)));
  let view;
  if(input.action==='templates') {
    const root=(process.env.WEBSITE_BUILDER_SKILL_ROOT||config.WEBSITE_BUILDER_SKILL_ROOT||fileURLToPath(new URL('../../skills/website-builder/',import.meta.url))).replaceAll('${PLUGIN_ROOT}',fileURLToPath(new URL('../../',import.meta.url)));
    if(input.mode==='audit'||input.mode==='bind'||input.targets?.length){
      if(!thread||!input.project_id)throw new Error('模板绑定需要 thread_id/project_id');
      const current=await store.get(thread);if(!current||current.project.id!==input.project_id)throw new Error('会话项目不匹配');
      if(input.mode==='audit')console.log(JSON.stringify(await store.auditTemplates(thread)));
      else{
        const binding=await store.bindTemplates(thread,input.targets||[]);
        if(input.mode==='bind')console.log(JSON.stringify(binding));
        else console.log(JSON.stringify({templates:await readTemplates(root,{...input,mode:'code',section:'all',ids:[...new Set<string>(input.targets.map((target:{id:string})=>target.id))]}),binding}));
      }
    }else console.log(JSON.stringify(await readTemplates(root,{...input,usage:input.mode==='select'?await store.templateUsage():undefined})));process.exit(0);
  }
  if(!thread)throw new Error('当前环境没有真实 CODEX_THREAD_ID；请提供 thread_id');
  if(input.action==='import_products') {
    console.log(JSON.stringify(await importProducts(store,skillRoot,{...input,action:input.mode||'import',thread_id:thread})));process.exit(0);
  }
  if(input.action==='screenshot') {
    const {bytes,...result}=await screenshotPage(store,{...input,thread_id:thread});
    console.log(JSON.stringify(result));process.exit(0);
  }
  if(input.action==='commerce') {
    console.log(JSON.stringify(await prepareCommerce(store,skillRoot,{...input,action:input.mode||'prepare',thread_id:thread})));process.exit(0);
  }
  if(!input.action||input.action==='open')view=await store.open({threadId:thread,projectId:input.project_id,newProject:input.new_project,name:input.name,brief:input.brief,language:input.language,pages:input.pages});
  else {
    const current=await store.get(thread);if(!current)throw new Error('请先打开当前会话项目');if(input.project_id&&input.project_id!==current.project.id)throw new Error('会话项目已切换');
    if(input.action==='plan')view=await store.plan(thread,input.pages||[]);
    else if(input.action==='begin')view=await store.begin(thread,input.paths||[]);
    else if(input.action==='write')view=await store.write(thread,input.files,input.finalize_pages);
    else if(input.action==='finish')view=await store.finish(thread,input.paths||[]);
    else if(input.action==='status')view=current;
    else throw new Error('不支持的 action');
  }
  console.log(JSON.stringify(compactProject(view)));
}catch(error){console.error((error as Error).message);process.exitCode=1;}
