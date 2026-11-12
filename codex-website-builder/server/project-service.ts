import { gzipSync } from 'node:zlib';
import { ProjectStore, type ProjectView } from './projects';
import { compileProjectPage, type SiteManifest } from './preview';
import { registerPreviewBuffer } from './resource-proxy';

export function previewPayload(gzip:string):string|{resource:string} {
  return gzip.length<=1000000?gzip:{resource:registerPreviewBuffer(Buffer.from(gzip,'base64'),'application/gzip')};
}

export function compactProject(view:ProjectView) {
  return {project_id:view.project.id,thread_id:view.threadId,directory:view.directory,metadata_directory:view.metadataDirectory,name:view.project.name,language:view.project.language,brief:view.project.brief,pages:view.project.pages.map(({path,status,error})=>({path,status,...(error?{error}:{} )}))};
}
export function projectService(store:ProjectStore) {
  const cache=new Map<string,{version:number;gzip:string}>();
  return async function sync(input:{since?:string;known?:Record<string,number>;threadId?:string;projectId?:string;waitMs?:number}) {
    const load=async()=>{
      if(!input.projectId)return store.reconcile(input.threadId);
      if(!input.threadId){const view=await store.get(undefined,input.projectId);return view?{...view,threadId:'',revision:`${view.project.id}::${view.project.revision}`}:null;}
      const binding=await store.get(input.threadId);
      return binding?.project.id===input.projectId?store.reconcile(input.threadId):store.get(input.threadId,input.projectId);
    };
    let view=await load();const known=input.known||{};
    const missing=view?.project.pages.some(page=>page.status==='ready'&&known[page.path]!==page.version);
    if(!missing&&(view?.revision||'none')===(input.since||'none')) {
      if(!input.projectId)view=await store.wait(input.since||'none',input.threadId,input.waitMs??20000);
      else {const deadline=Date.now()+Math.min(input.waitMs??20000,20000);while(Date.now()<deadline && view?.revision===input.since){await new Promise(resolve=>setTimeout(resolve,250));view=await load();}}
    }
    if(!view)return{revision:'none',unchanged:true};
    if(!missing&&view.revision===input.since)return{revision:view.revision,unchanged:true};
    const manifest:SiteManifest={directory:view.project.id,name:view.project.name,projectId:view.project.id,threadId:view.threadId,revision:view.revision,order:'项目页面计划',warnings:[],pages:view.project.pages.map(page=>({...page,url:`https://website-builder.invalid/files/${view!.project.id}/${page.path.split('/').map(encodeURIComponent).join('/')}`}))};
    const pages:Record<string,string|{resource:string}>={},errors:Record<string,string>={};let size=0;
    for(const page of view.project.pages) {
      if(page.status!=='ready'||known[page.path]===page.version)continue;
      const key=`${view.project.id}:${page.path}`;
      try {
        let saved=cache.get(key);
        if(!saved||saved.version!==page.version){saved={version:page.version,gzip:gzipSync(await compileProjectPage(store.root,view.project.id,page.path)).toString('base64')};cache.set(key,saved);}
        const payload=previewPayload(saved.gzip),length=typeof payload==='string'?payload.length:payload.resource.length;
        if(size>0&&size+length>2800000)break;
        pages[page.path]=payload;size+=length;
      } catch(error){errors[page.path]=(error as Error).message;}
    }
    // Do not retain unbounded compiled websites in a long-lived plugin process.
    let cacheBytes=[...cache.values()].reduce((sum,item)=>sum+item.gzip.length,0);
    for(const [key,value]of cache){if(cacheBytes<=24000000)break;cache.delete(key);cacheBytes-=value.gzip.length;}
    return{revision:view.revision,manifest,pages,errors,projects:await store.list()};
  };
}
