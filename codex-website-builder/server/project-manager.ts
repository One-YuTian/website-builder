import { readFile, mkdir, copyFile, realpath, stat, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, extname, join, relative, sep, isAbsolute } from 'node:path';
import { openDirectory } from './open-directory';
import { ProjectStore } from './projects';
import { compactProject } from './project-service';
import { screenshotPage } from './screenshot';
import { registerPreviewFile, registerPreviewBuffer } from './resource-proxy';
import { gunzipSync } from 'node:zlib';
import { contained } from './preview';

const mime = (path: string) => ({'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.ico':'image/x-icon','.svg':'image/svg+xml','.gif':'image/gif','.pdf':'application/pdf','.json':'application/json'}[extname(path).toLowerCase()] || 'application/octet-stream');
export function projectManager(store: ProjectStore) {
  const captures=new Map<string,{text:string;time:number}>();
  const thumbnails = new Map<string, Promise<void>>();
  const thumbnailRetry = new Map<string, number>();
  const shutdown = new AbortController();
  async function thumbnail(id: string) {
    if(shutdown.signal.aborted)return;
    if (thumbnails.has(id)) return thumbnails.get(id);
    const task = (async () => {
      const row = store.database.row(id), project = store.database.project(id);
      const home = project?.pages.find(page => /^(?:index|home)\.html?$/i.test(page.path));
      if (!home || home.status !== 'ready' || row.thumbnail_revision === String(home.version)) return;
      if((thumbnailRetry.get(id)||0)>Date.now())return;
      const thread: any = store.database.sql.prepare('SELECT thread_id FROM threads WHERE project_id=? LIMIT 1').get(id);
      if (!thread) return;
      try {
        const result = await screenshotPage(store, { thread_id: thread.thread_id, project_id: id, path: home.path, thumbnail: true, signal: shutdown.signal });
        store.database.sql.prepare('UPDATE projects SET thumbnail_path=?,thumbnail_revision=? WHERE id=? AND deleted_at IS NULL').run(result.path, String(home.version), id);
      } catch (error) { thumbnailRetry.set(id,Date.now()+60000);if(!shutdown.signal.aborted)console.error(`Website Builder thumbnail ${id}: ${(error as Error).message}`); }
    })();
    thumbnails.set(id, task);
    void task.finally(() => thumbnails.delete(id));
    return task;
  }
  async function list() {
    const projects = await store.list();
    return Promise.all(projects.map(async project => {
      // Generate lazily; listing never waits for a browser or a network resource.
      if (thumbnails.size < 2) void thumbnail(project.id);
      let image: string | undefined;
      if (project.thumbnailPath) {
        const directory = await realpath(store.metadataDirectory(project.id));
        const path = await realpath(project.thumbnailPath).catch(() => '');
        const rel = relative(directory, path);
        if (path && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)) image = `data:image/png;base64,${(await readFile(path)).toString('base64')}`;
      }
      const details=store.database.project(project.id);
      let domain=[...`${project.name} ${details?.brief||''}`.matchAll(/(?:https?:\/\/)?((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,24})\b/gi)].map(match=>match[1].toLowerCase()).find(host=>! /\.(?:html?|css|js|json|png|jpe?g|webp|svg|avif)$/i.test(host));
      if(!domain)for(const name of ['index.html','components/footer.js']){
        try{const base=await realpath(join(store.root,project.id)),source=await readFile(await contained(base,name),'utf8');
          domain=source.match(/<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*\bhref\s*=\s*["']https?:\/\/([^/"']+)/i)?.[1]||source.match(/support@([a-z0-9.-]+\.[a-z]{2,24})/i)?.[1];
          if(domain)break;
        }catch{/* Unfinished projects retain their existing title until a domain is known. */}
      }
      return { id: project.id, name: project.name, displayName:`网站-${domain||project.name}`, domain, updatedAt: project.updatedAt, thumbnail: image };
    }));
  }
  async function context(thread?: string, panelId?: string) {
    const panel = store.database.context(thread, panelId);
    const id = panel?.project_id;
    if (id && store.database.project(id)) return { page: 'project', panel_id: panel.panel_id, ...compactProject((await store.get(thread, id))!),thread_id:thread||null };
    return { page: 'home', panel_id: panel?.panel_id || panelId || null, projects: await store.list() };
  }
  async function resources(id: string) {
    const view = await store.get(undefined, id);
    if (!view) throw Error('项目不存在');
    // Index real user assets without following symlinks or loading bytes into model context.
    const scan = async (directory: string) => {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const path = join(directory, entry.name);
        if (entry.isDirectory()) await scan(path);
        else if (entry.isFile() && !/\.(?:html?|js|mjs|css)$/i.test(path)) {
          const info = await stat(path);
          store.database.sql.prepare('INSERT INTO resources VALUES (?,?,?,?,?,?,?) ON CONFLICT(project_id,path) DO UPDATE SET size=excluded.size,mime=excluded.mime')
            .run(createHash('sha256').update(id + path).digest('hex'), id, null, entry.name, path, mime(path), info.size);
        }
      }
    };
    await scan(view.directory);
    return store.database.sql.prepare('SELECT id,name,path,mime,size,thread_id FROM resources WHERE project_id=? ORDER BY name').all(id);
  }
  async function run(input: {action?: string; panel_id?: string; thread_id?: string; project_id?: string; name?: string; source_path?: string; path?:string;width?:number;capture_id?:string;chunk?:string;offset?:number;final?:boolean}) {
    const action = input.action || 'list';
    const panel=input.panel_id?store.database.panelById(input.panel_id):undefined;
    const thread = input.thread_id || process.env.CODEX_THREAD_ID || process.env.CODEX_SESSION_ID || panel?.thread_id || undefined;
    if (action === 'list') return { projects: await list(), thread_id: thread || null };
    // Global navigation has a panel identity before it has a chat identity.
    // Never substitute an anonymous/fake thread or another project's last chat.
    if (action === 'context') return context(thread, input.panel_id);
    if (!input.panel_id || !/^[a-zA-Z0-9_-]{8,128}$/.test(input.panel_id)) throw Error('需要当前面板 ID');
    if(panel?.thread_id && thread && panel.thread_id!==thread)throw Error('面板不属于当前会话');
    const id = input.project_id;
    if (action === 'home') { store.database.panel(input.panel_id, thread||'', null); return context(thread, input.panel_id); }
    if (action === 'create' || action === 'open' || action === 'bind') {
      if (action !== 'create' && !id) throw Error('需要项目 ID');
      const view = thread ? await store.open({ threadId: thread, projectId: id, newProject: action === 'create', name: input.name })
        : action === 'create' ? await store.createProject({name:input.name}) : await store.get(undefined,id);
      if(!view)throw Error('项目不存在或已删除');
      store.database.panel(input.panel_id, thread||'', view.project.id);
      return { page: 'project', panel_id: input.panel_id, ...compactProject(view),thread_id:thread||null };
    }
    if (!id) throw Error('需要项目 ID');
    if(action==='restore') {
      if(!store.database.row(id))throw Error('项目不存在');
      store.database.sql.prepare('UPDATE projects SET deleted_at=NULL WHERE id=?').run(id);
      return {projects:await list()};
    }
    const view = await store.get(thread, id);
    if (!view) throw Error('项目不存在');
    if(action==='images') {
      const images=[];
      for(const resource of await resources(id) as {id:string;name:string;path:string;mime:string;size:number}[]) {
        if(!resource.mime.startsWith('image/'))continue;
        try {
          const base=await realpath(view.directory),file=await realpath(resource.path),path=relative(base,file);
          if(path==='..'||path.startsWith(`..${sep}`)||isAbsolute(path))continue;
          images.push({...resource,path:path.split(sep).join('/'),url:await registerPreviewFile(file,resource.mime)});
        }catch{/* Removed assets disappear from the next refresh. */}
      }
      return {images};
    }
    if(action==='capture') {
      if(!input.capture_id||!/^[a-zA-Z0-9_-]{8,128}$/.test(input.capture_id)||!input.path)throw Error('截图请求无效');
      for(const [key,item]of captures)if(Date.now()-item.time>120000)captures.delete(key);
      const key=`${input.panel_id}:${id}:${input.capture_id}`;
      if(input.offset===0){if(captures.size>=8)throw Error('截图任务过多');captures.set(key,{text:'',time:Date.now()});}
      const capture=captures.get(key);
      if(!capture||input.offset!==capture.text.length||!input.chunk||input.chunk.length>512000)throw Error('截图数据分片无效');
      capture.text+=input.chunk;capture.time=Date.now();
      if(capture.text.length>32*1024*1024){captures.delete(key);throw Error('当前页面截图数据超过限制');}
      if(!input.final)return{received:capture.text.length};
      captures.delete(key);
      const snapshot=gunzipSync(Buffer.from(capture.text,'base64'),{maxOutputLength:64*1024*1024}).toString('utf8');
      if(!/<html\b/i.test(snapshot))throw Error('当前页面快照不完整');
      const image=await screenshotPage(store,{thread_id:thread,project_id:id,path:input.path,width:input.width,snapshot});
      return {resource:registerPreviewBuffer(image.bytes,'image/png'),width:image.width,fullPage:true,page:image.page};
    }
    if (action === 'delete') { store.database.remove(id); return { page: 'home', projects: await list() }; }
    if (action === 'folder') {
      await openDirectory(view.directory);
      return { directory: view.directory };
    }
    if (action === 'resources') return { resources: await resources(id) };
    if (action === 'attach') {
      if (!input.source_path || !isAbsolute(input.source_path)) throw Error('需要用户提供的资源绝对路径');
      const source = await realpath(input.source_path), info = await stat(source);
      if (!info.isFile() || info.size > 64 * 1024 * 1024) throw Error('资源必须是文件且不超过 64 MB');
      const bytes = await readFile(source), hash = createHash('sha256').update(bytes).digest('hex');
      const folder = join(view.metadataDirectory, 'session-assets'); await mkdir(folder, { recursive: true });
      const path = join(folder, hash + extname(source)); await copyFile(source, path);
      const name = source.split(/[\\/]/).pop()!;
      store.database.sql.prepare('INSERT INTO resources VALUES (?,?,?,?,?,?,?) ON CONFLICT(project_id,path) DO UPDATE SET thread_id=excluded.thread_id,name=excluded.name')
        .run(createHash('sha256').update(id + path).digest('hex'), id, thread||null, name, path, mime(path), info.size);
      return { resources: await resources(id) };
    }
    throw Error('不支持的项目管理操作');
  }
  return { run, context, thumbnail, close:async()=>{shutdown.abort();await Promise.allSettled([...thumbnails.values()]);} };
}
