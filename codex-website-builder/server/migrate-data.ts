import { cp, mkdir, open, readdir, readFile, rename, rm, stat, lstat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

// Copy, never move/delete user files. Publish whole projects only after copying.
export async function migrateLegacyData(projectRoot: string, sources?: string[]) {
  if(!sources && (process.env.WEBSITE_BUILDER_PROJECT_ROOT || process.env.WEBSITE_BUILDER_DATA_DIR)) return;
  const pluginRoot=fileURLToPath(new URL('../../',import.meta.url));
  if(!sources) {
    sources=[join(pluginRoot,'project')];
    // Installed version caches are siblings inside this plugin's own directory.
    if(dirname(pluginRoot).split(/[\\/]/).pop()==='codex-website-builder') {
      for(const entry of await readdir(dirname(pluginRoot),{withFileTypes:true})) {
        if(!entry.isDirectory())continue;
        const root=join(dirname(pluginRoot),entry.name);
        const manifest=await readFile(join(root,'package.json'),'utf8').then(JSON.parse).catch(()=>null);
        if(manifest?.name==='codex-website-builder')sources.push(join(root,'project'));
      }
    }
  }
  const existing=[];
  for(const source of new Set(sources))if(resolve(source)!==resolve(projectRoot)&&(await stat(source).catch(()=>null))?.isDirectory())existing.push(source);
  if(!existing.length)return;
  const base=dirname(projectRoot);await mkdir(join(base,'db'),{recursive:true});
  const lockPath=join(base,'db','migration.lock');
  let lock;
  for(let attempt=0;attempt<100;attempt++){
    try{lock=await open(lockPath,'wx');await lock.writeFile(String(process.pid));break;}catch(error){
      if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;
      const pid=Number(await readFile(lockPath,'utf8').catch(()=>''));
      if(pid>0){try{process.kill(pid,0);}catch(check){if((check as NodeJS.ErrnoException).code==='ESRCH'){await rm(lockPath,{force:true});continue;}}}
      else {const info=await stat(lockPath).catch(()=>null);if(info&&Date.now()-info.mtimeMs>120000){await rm(lockPath,{force:true});continue;}}
      await new Promise(resolve=>setTimeout(resolve,100));
    }
  }
  if(!lock)throw Error('全局项目迁移正在进行，请稍后重新打开插件');
  try {
    await mkdir(projectRoot,{recursive:true});
    const state=join(base,'.builder-state');
    for(const source of existing) {
      const oldState=join(dirname(source),'.builder-state');
      for(const entry of await readdir(source,{withFileTypes:true})) {
        if(!entry.isDirectory()||!/^[a-f0-9]{4}(?:-[a-f0-9]{4}){3}$/.test(entry.name))continue;
        const target=join(projectRoot,entry.name),metadata=join(state,'projects',entry.name);
        if(await stat(target).catch(()=>null)||await stat(metadata).catch(()=>null))continue;
        const stage=join(base,`.migration-${randomUUID()}`);
        try {
          await cp(join(source,entry.name),stage,{recursive:true,errorOnExist:true,force:false,filter:async path=>!(await lstat(path)).isSymbolicLink()});
          const oldMeta=join(oldState,'projects',entry.name);
          if(await stat(oldMeta).catch(()=>null)){await mkdir(dirname(metadata),{recursive:true});await cp(oldMeta,metadata,{recursive:true,errorOnExist:true,force:false,filter:async path=>!(await lstat(path)).isSymbolicLink()});}
          await rename(stage,target);
        } finally {await rm(stage,{recursive:true,force:true});}
      }
      const threads=await readdir(join(oldState,'threads'),{withFileTypes:true}).catch(()=>[]);
      await mkdir(join(state,'threads'),{recursive:true});
      for(const entry of threads)if(entry.isFile()&&entry.name.endsWith('.json'))await cp(join(oldState,'threads',entry.name),join(state,'threads',entry.name),{force:false});
      if(await stat(join(oldState,'active.json')).catch(()=>null))await cp(join(oldState,'active.json'),join(state,'active.json'),{force:false});
    }
  } finally {await lock.close();await rm(lockPath,{force:true});}
}
