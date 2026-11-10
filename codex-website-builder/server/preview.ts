import { createServer } from 'node:http';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { basename, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { snapshotCompiler } from './snapshot';
import {resourceChunk} from './resource-proxy';
import {proxyRuntime} from './proxy-runtime';

export interface SitePage { path: string; title: string; url: string; html?: string; status?: 'queued'|'generating'|'ready'|'error'; version?: number; error?: string }
export interface SiteManifest { directory: string; name: string; pages: SitePage[]; order: string; warnings: string[]; projectId?:string; threadId?:string; revision?:string }
const mime: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.mp4': 'video/mp4', '.avif': 'image/avif' };
const inside = (root: string, path: string) => { const rel = relative(root, path); return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel)); };
const natural = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true });

// All filesystem reads are restricted to the configured website root, including symlinks.
export async function contained(root: string, path: string) {
  const target = await realpath(resolve(root, path));
  if (!inside(root, target)) throw new Error('目录超出已配置的网站根目录');
  return target;
}

export async function scanSite(root: string, directory: string, prefix: string): Promise<SiteManifest> {
  const site = await contained(root, directory);
  if (!(await stat(site)).isDirectory()) throw new Error('请选择网站目录');
  const documents = new Map<string, string>();
  async function walk(folder: string) {
    for (const entry of (await readdir(folder, { withFileTypes: true })).sort((a, b) => natural(a.name, b.name))) {
      if (entry.name.startsWith('.') || ['node_modules', 'vendor'].includes(entry.name) || entry.isSymbolicLink()) continue;
      const path = join(folder, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (/\.html?$/i.test(entry.name)) documents.set(relative(site, path).split(sep).join('/'), await readFile(path, 'utf8'));
    }
  }
  await walk(site);
  if (!documents.size) throw new Error('目录中没有找到 HTML 页面');
  const ordered: string[] = [];
  const add = (path: string) => { if (documents.has(path) && !ordered.includes(path)) ordered.push(path); };
  const warnings: string[] = [];
  try {
    const data = await readFile(await contained(root, join(site, 'js/data.js')), 'utf8');
    if (data.includes('"/img/')) {
      try { await stat(join(site, 'img')); } catch { warnings.push('商品图片沿用原站 CDN 加载。'); }
    }
  } catch { /* Site-specific data files are optional. */ }
  let order = '首页、主导航、页脚导航、其余页面自然排序';
  try {
    const file = await contained(root, join(site, 'website-builder.order.json'));
    const custom: unknown = JSON.parse(await readFile(file, 'utf8'));
    if (!Array.isArray(custom) || custom.some(path => typeof path !== 'string' || !documents.has(path))) throw new Error('排序文件必须为现有 HTML 相对路径的数组');
    custom.forEach(add); order = 'website-builder.order.json，然后补充未列出的页面';
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') warnings.push(String((error as Error).message)); }
  add('index.html'); add('index.htm');
  for (const navigation of ['components/header.js', 'components/footer.js', 'index.html']) {
    try {
      const file = await contained(root, join(site, navigation));
      const html = await readFile(file, 'utf8');
      for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"'#?]+\.html?)(?:[?#][^"']*)?["']/gi)) {
        const url = new URL(match[1], 'https://site.local/');
        if (url.origin === 'https://site.local') add(decodeURIComponent(url.pathname.slice(1)));
      }
    } catch { /* Navigation components are optional. */ }
  }
  [...documents.keys()].sort(natural).forEach(add);
  const key = relative(root, site).split(sep).map(encodeURIComponent).join('/');
  return { directory: relative(root, site).split(sep).join('/') || '.', name: basename(site), order, warnings,
    pages: ordered.map(path => ({ path, title: (documents.get(path)!.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? path).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(), url: `${prefix}/files/${key ? `${key}/` : ''}${path.split('/').map(encodeURIComponent).join('/')}` })) };
}

// Injected only into the served response; the reference website is never modified.
function instrument(html: string, embedded = false) {
  const script = `<style>html{height:auto!important;min-height:0!important;scrollbar-width:thin;scrollbar-color:transparent transparent!important}html[data-wb-scrolling]{scrollbar-color:rgba(75,100,87,.48) transparent!important}html::-webkit-scrollbar{width:7px;height:7px}html::-webkit-scrollbar-track{background:transparent}html::-webkit-scrollbar-thumb{background:transparent;border-radius:8px}html[data-wb-scrolling]::-webkit-scrollbar-thumb{background:rgba(75,100,87,.48)}html::-webkit-scrollbar-button{display:none}body{min-height:0!important}</style><script>
(() => {
  const virtualUrl = ${embedded ? '"__WEBSITE_BUILDER_VIRTUAL_URL__"' : 'location.href'};
  window.__websiteBuilderLocation = new URL(virtualUrl);
  const embedded = ${embedded};
  if (embedded) {
    let stored = "__WEBSITE_BUILDER_STORAGE__";
    const storage = {getItem:key=>Object.prototype.hasOwnProperty.call(stored,key)?stored[key]:null,setItem(key,value){stored[String(key)]=String(value);parent.postMessage({type:'website-builder:storage',value:stored},'*');},removeItem(key){delete stored[key];parent.postMessage({type:'website-builder:storage',value:stored},'*');},clear(){stored={};parent.postMessage({type:'website-builder:storage',value:stored},'*');},key:index=>Object.keys(stored)[index]||null,get length(){return Object.keys(stored).length;}};
    Object.defineProperty(window,'localStorage',{value:storage}); Object.defineProperty(window,'sessionStorage',{value:storage});
    // Preserve embedded images when the demo's optional URL formatter adds its CDN prefix.
    let imageFormatter;
    Object.defineProperty(window,'formatCdnUrl',{configurable:true,get:()=>imageFormatter,set:fn=>{imageFormatter=typeof fn==='function'?function(url,...args){return typeof url==='string' && /^(data:|blob:)/i.test(url)?url:fn.call(this,url,...args);}:fn;}});
    addEventListener('message',event=>{if(event.source===parent && event.data?.type==='website-builder:storage-sync'){stored=event.data.value;dispatchEvent(new Event('storage'));}});
  }
  let previous = 0, pending = false;
  let scrollIdle;
  addEventListener('scroll',()=>{document.documentElement.dataset.wbScrolling='true';clearTimeout(scrollIdle);scrollIdle=setTimeout(()=>delete document.documentElement.dataset.wbScrolling,900);},true);
  const send = () => { pending = false; if (!document.body) return;
    const body = document.body, styles = getComputedStyle(body);
    // body.scrollHeight can equal the current iframe viewport even after content shrinks.
    // Measure normal-flow bounds separately so a formerly tall frame can become shorter.
    const bottom = Array.from(body.children).reduce((height,child) => getComputedStyle(child).position === 'fixed' ? height : Math.max(height,child.getBoundingClientRect().bottom + scrollY),0);
    const height = Math.ceil(Math.max(body.offsetHeight, body.getBoundingClientRect().height, bottom, body.scrollHeight > innerHeight + 1 ? body.scrollHeight : 0) + parseFloat(styles.marginTop || 0) + parseFloat(styles.marginBottom || 0));
    if (height !== previous) { previous = height; parent.postMessage({type:'website-builder:height',height}, '*'); }
  };
  const measure = () => { if (!pending) { pending = true; setTimeout(send, 80); } };
  addEventListener('DOMContentLoaded', () => {
    new ResizeObserver(measure).observe(document.body);
    new MutationObserver(measure).observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true});
    document.fonts.ready.then(measure); send();
    parent.postMessage({type:'website-builder:location',path:new URL(virtualUrl).pathname},'*');
  });
  addEventListener('load',measure,true); addEventListener('resize',measure);
  addEventListener('message',event => { if(event.source === parent && event.data?.type === 'website-builder:measure') { document.documentElement.style.setProperty('overflow-y','auto','important');previous = 0; measure(); } });
  const local = value => { try { const url = new URL(value,virtualUrl), current = new URL(virtualUrl); return url.origin === current.origin && url.pathname.startsWith(current.pathname.split('/files/')[0] + '/files/'); } catch { return false; } };
  const blocked = url => parent.postMessage({type:'website-builder:blocked',url:String(url)},'*');
  const navigate = url => blocked(new URL(url,virtualUrl).href);
  window.__websiteBuilderNavigate = url => { if(local(url))navigate(url);else blocked(url); };
  if(embedded) {
    let state = null;
    Object.defineProperty(history,'state',{get:()=>state});
    for(const name of ['replaceState','pushState'])history[name] = function(value,_unused,url){
      const next = new URL(url || window.__websiteBuilderLocation.href,window.__websiteBuilderLocation.href);
      if(!local(next.href) || next.pathname !== new URL(virtualUrl).pathname){blocked(next.href);return;}
      state=value;window.__websiteBuilderLocation=next;
      document.querySelector('base').href=next.href;
    };
  }
  if(embedded)HTMLFormElement.prototype.submit = function(){const action=this.action || virtualUrl;if(local(action))navigate(action);else blocked(action);};
  // Chromium Navigation API also catches script location.assign/href/replace and direct form.submit().
  window.navigation?.addEventListener('navigate',event => { if (event.cancelable && (embedded || !local(event.destination.url))) { event.preventDefault(); if(local(event.destination.url))navigate(event.destination.url);else blocked(event.destination.url); } });
  window.open = function(url) { if (local(url)) { if(embedded)navigate(url);else location.href = new URL(url,virtualUrl).href; } else blocked(url); return null; };
  document.addEventListener('click',event => {
    const anchor = event.target.closest?.('a[href]'); if(!anchor) return;
    const url = new URL(anchor.getAttribute('href'),virtualUrl);
    if(url.protocol === 'javascript:') return;
    if(!local(url.href)) { event.preventDefault(); event.stopImmediatePropagation(); blocked(url.href); }
    else if(embedded) {
      event.preventDefault();event.stopImmediatePropagation();
      if(url.pathname === new URL(virtualUrl).pathname && url.hash) {
        const target=document.getElementById(decodeURIComponent(url.hash.slice(1)));
        if(target)parent.postMessage({type:'website-builder:scroll-to',y:target.getBoundingClientRect().top},'*');
      } else navigate(url.href);
    }
    else if(anchor.target && anchor.target !== '_self') anchor.target = '_self';
  },true);
  document.addEventListener('submit',event => {const form=event.target;const action=(event.submitter?.hasAttribute('formaction')?event.submitter.formAction:form.action)||virtualUrl;event.preventDefault();blocked(action);},true);
  document.addEventListener('pointerdown',()=>parent.postMessage({type:'website-builder:focus'},'*'),true);
  document.addEventListener('wheel',event=>{
    if (!event.ctrlKey && !event.metaKey) {
      let target = event.target;
      while(target && target !== document.body) { const css = getComputedStyle(target); if (/(auto|scroll)/.test(css.overflowY) && target.scrollHeight > target.clientHeight && ((event.deltaY > 0 && target.scrollTop + target.clientHeight < target.scrollHeight) || (event.deltaY < 0 && target.scrollTop > 0))) return; target = target.parentElement; }
      const root=document.scrollingElement;
      if(root && root.scrollHeight>innerHeight+1 && ((event.deltaY>0 && root.scrollTop+innerHeight<root.scrollHeight-1)||(event.deltaY<0 && root.scrollTop>0)))return;
    }
    event.preventDefault(); parent.postMessage({type:'website-builder:wheel',dx:event.shiftKey?event.deltaY:event.deltaX,dy:event.shiftKey?0:event.deltaY,zoom:event.ctrlKey||event.metaKey,x:event.clientX,y:event.clientY},'*');
  },{passive:false});
})();<\/script>`;
  const base = embedded ? '<base href="__WEBSITE_BUILDER_BASE_URL__">' : '';
  return /<head\b[^>]*>/i.test(html) ? html.replace(/<head\b[^>]*>/i, match => match + base + script + proxyRuntime) : base + script + proxyRuntime + html;
}

export async function compileProjectPage(root:string,directory:string,path:string) {
  const vendor=fileURLToPath(new URL('../vendor/',import.meta.url));
  const assets:Record<string,string>=JSON.parse(await readFile(join(vendor,'manifest.json'),'utf8'));
  const base=await realpath(root),site=await contained(base,directory);
  return instrument(await snapshotCompiler(base,site,vendor,assets)(path),true);
}

export async function createPreview(ui: string, configuredRoot: string, defaultDirectory = 'www.noventrad.com', projectSync?: (input:{since?:string;known?:Record<string,number>;waitMs?:number})=>Promise<unknown>) {
  const root = await realpath(configuredRoot);
  const vendor = fileURLToPath(new URL('../vendor/', import.meta.url));
  const assets: Record<string, string> = JSON.parse(await readFile(join(vendor, 'manifest.json'), 'utf8'));
  const siteKeys = new Set<string>();
  async function readWebsite(directory: string, includeHtml = true) {
    const manifest = await scanSite(root, directory, 'https://website-builder.invalid');
    if (!includeHtml) return manifest;
    const site = await contained(root, directory);
    const compile = snapshotCompiler(root, site, vendor, assets);
    for (const page of manifest.pages) page.html = instrument(await compile(page.path), true);
    return manifest;
  }
  async function readPage(directory: string, path: string) {
    const manifest = await readWebsite(directory, false);
    if (!manifest.pages.some(page => page.path === path)) throw new Error('页面不在识别结果内');
    const site = await contained(root, directory);
    return instrument(await snapshotCompiler(root, site, vendor, assets)(path), true);
  }
  const token = randomBytes(24).toString('hex');
  let origin = '';
  const service = createServer(async (req, res) => {
    try {
      if (req.method !== 'GET') { res.writeHead(405).end(); return; }
      const url = new URL(req.url!, origin);
      const prefix = `/${token}`;
      if (!url.pathname.startsWith(prefix + '/')) { res.writeHead(404).end(); return; }
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      const route = url.pathname.slice(prefix.length);
      if(route==='/api/resource'){
        const resource=await resourceChunk(url.searchParams.get('url')||'',Math.max(0,Number(url.searchParams.get('offset')||0)),url.searchParams.get('raw')==='true');
        res.setHeader('Content-Type','application/json');res.end(JSON.stringify(resource));return;
      }
      if (route === '/canvas') { res.setHeader('Content-Type', mime['.html']); res.setHeader('Content-Security-Policy', "frame-src blob: data:; object-src 'none'"); res.end(render()); return; }
      if (route === '/api/site') {
        const directory = url.searchParams.get('directory') || defaultDirectory;
        const manifest = url.searchParams.get('embedded') === '1' ? await readWebsite(directory) : await scanSite(root, directory, origin + prefix);
        siteKeys.add(manifest.directory === '.' ? '' : manifest.directory);
        res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(manifest)); return;
      }
      if(route === '/api/project-sync' && projectSync) {
        const value=await projectSync({since:url.searchParams.get('since')||'none',known:JSON.parse(url.searchParams.get('known')||'{}'),waitMs:Number(url.searchParams.get('wait')||'20000')});
        res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));return;
      }
      if (route.startsWith('/vendor/')) {
        const name = route.slice('/vendor/'.length);
        if (!/^[a-zA-Z0-9._-]+$/.test(name)) throw new Error('资源路径无效');
        const path = await contained(vendor, name);
        const type = mime[extname(path).toLowerCase()];
        if (!type) { res.writeHead(403).end(); return; }
        res.setHeader('Content-Type', type); res.end(await readFile(path)); return;
      }
      if (route.startsWith('/files/')) {
        const requested = decodeURIComponent(route.slice('/files/'.length));
        if (requested.includes('\\') || requested.includes('\0') || requested.split('/').some(part => part.startsWith('.'))) throw new Error('不可读取此路径');
        const path = await contained(root, requested);
        const type = mime[extname(path).toLowerCase()];
        if (!type) { res.writeHead(403).end(); return; }
        const data = await readFile(path);
        res.setHeader('Content-Type', type);
        if (/\.(html?|js|css|json)$/i.test(path)) {
          let text = data.toString('utf8');
          for (const [remote, local] of Object.entries(assets)) {
            text = text.replaceAll(remote, `${origin}${prefix}/vendor/${local}`).replaceAll(remote.replaceAll('&', '&amp;'), `${origin}${prefix}/vendor/${local}`);
          }
          const key = [...siteKeys].sort((a, b) => b.length - a.length).find(key => !key || requested.startsWith(key + '/'));
          if (key !== undefined) {
            const base = `${prefix}/files/${key ? `${key.split('/').map(encodeURIComponent).join('/')}/` : ''}`;
            text = text.replace(/(["'`])\/(?!\/)([^"'`\s<>]+\.(?:html?|css|js|json|png|jpe?g|gif|svg|webp|avif|woff2?|ttf|ico)(?:[?#][^"'`\s<>]*)?)\1/gi, (_match, quote, path) => `${quote}${base}${path}${quote}`);
          }
          res.end(/\.html?$/i.test(path) ? instrument(text) : text);
        } else res.end(data);
        return;
      }
      res.writeHead(404).end();
    } catch (error) {
      res.writeHead((error as NodeJS.ErrnoException).code === 'ENOENT' ? 404 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: (error as Error).message }));
    }
  });
  await new Promise<void>((resolve, reject) => { service.once('error', reject); service.listen(0, '127.0.0.1', resolve); });
  const port = (service.address() as import('node:net').AddressInfo).port;
  origin = `http://127.0.0.1:${port}`;
  function render() {
    const config = JSON.stringify({ api: `${origin}/${token}/api/site`, projectApi: `${origin}/${token}/api/project-sync`, resourceApi:`${origin}/${token}/api/resource`, origin, defaultDirectory }).replaceAll('<', '\\u003c');
    return ui.replace('</head>', `<script>window.__WEBSITE_BUILDER__=${config};<\/script></head>`);
  }
  // Separate origin prevents website scripts from accessing the standalone canvas.
  return { origin, url: `http://localhost:${port}/${token}/canvas`, render, service, readWebsite, readPage };
}
