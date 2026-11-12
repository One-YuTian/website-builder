import { readFile } from 'node:fs/promises';
import { basename, dirname, extname, resolve } from 'node:path';
import { contained } from './preview';
import { parse } from 'acorn';
import { proxyResource, registerPreviewFile } from './resource-proxy';

// Rewrite navigation in preview scripts using syntax nodes, never by matching source text.
// The original files are not written. Opaque blob frames cannot cancel Navigation API events.
export function previewScript(source: string, importBase?:string) {
  type Node = { type: string; start: number; end: number; [key: string]: any };
  const isMember = (node: Node, name: string) => node?.type === 'MemberExpression' && ((!node.computed && node.property.name === name) || (node.computed && node.property.value === name));
  const isLocation = (node: Node): boolean => node?.type === 'Identifier' && node.name === 'location' || isMember(node,'location') && ['window','self','document'].includes(node.object?.name);
  const changes: {start:number;end:number;text:string}[] = [];
  function visit(node: Node) {
    if(node.type==='ImportExpression'){
      const value=source.slice(node.source.start,node.source.end);
      changes.push({start:node.start,end:node.end,text:`window.__websiteBuilderImport(${importBase?`new URL(${value},${JSON.stringify(importBase)}).href`:value})`});return;
    }
    if (node.type === 'AssignmentExpression' && (isLocation(node.left) || isMember(node.left,'href') && isLocation(node.left.object))) {
      changes.push({start:node.start,end:node.end,text:`window.__websiteBuilderNavigate(${source.slice(node.right.start,node.right.end)})`}); return;
    }
    if (node.type === 'CallExpression' && ['assign','replace'].some(name=>isMember(node.callee,name)) && isLocation(node.callee.object)) {
      changes.push({start:node.start,end:node.end,text:`window.__websiteBuilderNavigate(${node.arguments[0] ? source.slice(node.arguments[0].start,node.arguments[0].end) : "''"})`}); return;
    }
    if (node.type === 'MemberExpression' && isLocation(node.object) && ['search','pathname','hash','href','origin','host','hostname','protocol'].some(name=>isMember(node,name))) {
      changes.push({start:node.start,end:node.end,text:`window.__websiteBuilderLocation.${node.computed ? node.property.value : node.property.name}`}); return;
    }
    for(const value of Object.values(node)) {
      if(Array.isArray(value)) value.forEach(child=>{if(child?.type)visit(child);});
      else if(value && typeof value === 'object' && value.type) visit(value);
    }
  }
  try { visit(parse(source,{ecmaVersion:'latest',sourceType:'script',allowReturnOutsideFunction:true}) as unknown as Node); }
  catch { try{visit(parse(source,{ecmaVersion:'latest',sourceType:'module'}) as unknown as Node);}catch{return source;} }
  for(const edit of changes.sort((a,b)=>b.start-a.start)) source=source.slice(0,edit.start)+edit.text+source.slice(edit.end);
  return source;
}

const types: Record<string, string> = { '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.avif':'image/avif', '.gif':'image/gif', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.woff':'font/woff', '.woff2':'font/woff2', '.ttf':'font/ttf', '.otf':'font/otf', '.mp4':'video/mp4', '.mp3':'audio/mpeg', '.json':'application/json' };
async function replaceAsync(value: string, regex: RegExp, replace: (match: RegExpMatchArray) => Promise<string>) {
  const matches = [...value.matchAll(regex)];
  const values = await Promise.all(matches.map(replace));
  let index = 0; return value.replace(regex, () => values[index++]);
}

export function snapshotCompiler(root: string, site: string, vendor: string, vendors: Record<string, string>) {
  const cache = new Map<string, Promise<string>>();
  let documentFile = '';
  const missing = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="#f4f5f4"/><path d="M122 120l20-24 16 16 18-28 20 36z" fill="#d1d8d3"/></svg>').toString('base64');
  async function asset(url: string, from: string, external=false, preserveMissing=false): Promise<string> {
    const decoded = url.replaceAll('&amp;', '&');
    if (/^(data:|blob:|#)/i.test(decoded)) return decoded;
    let file: string;
    if (/^(?:https?:)?\/\//i.test(decoded)) {
      const remote=decoded.startsWith('//')?`https:${decoded}`:decoded;
      if (!vendors[remote] || process.env.WEBSITE_BUILDER_PREVIEW_VENDOR_FIXTURES!=='1') {
        if(!external&&!/\.(?:m?js|css)(?:[?#]|$)/i.test(remote))return remote;
        const resource=await proxyResource(remote);return `data:${resource.mime};base64,${resource.bytes.toString('base64')}`;
      }
      file = resolve(vendor, vendors[remote]);
    } else {
      const path=decodeURIComponent(decoded.split(/[?#]/)[0]);
      file = path.startsWith('/') ? resolve(site,path.slice(1)) : resolve(dirname(from),path);
    }
    const type = types[extname(file).toLowerCase()];
    if (!type) return url;
    const cacheKey=`${external?'embedded':'lazy'}:${preserveMissing?'literal':'resource'}:${file}`;
    if (!cache.has(cacheKey)) cache.set(cacheKey, (async () => {
      try {
        const safe = await contained(file.startsWith(vendor) ? vendor : root, file);
        // Keep local bitmap/media payloads out of HTML and classic scripts. CSS
        // dependencies remain embedded because data-URI stylesheets have no base.
        if(!external && /^(?:image\/(?!svg)|video\/|audio\/)/.test(type))return registerPreviewFile(safe,type);
        let bytes = await readFile(safe);
        if (/\.css$/i.test(file)) bytes = Buffer.from(await transform(bytes.toString('utf8'), safe, true));
        else if (/\.js$/i.test(file) && !file.startsWith(vendor)) {
          // URL strings in classic scripts resolve against the document, unlike CSS URLs.
          bytes = Buffer.from(await transform(previewScript(bytes.toString('utf8')), documentFile || safe, false, true));
        }
        return `data:${type};base64,${bytes.toString('base64')}`;
      } catch {
        // Product JSON literals are inputs to the site's CDN formatter, not
        // local document resources. Never turn them into placeholder data URIs.
        if(preserveMissing&&type.startsWith('image/'))return url;
        // Product paths are served by the original site's CDN, not its local HTML folder.
        if(type.startsWith('image/') && decoded.startsWith('/img/') && basename(site) === 'www.noventrad.com') return `https://cdn.noventrad.com${decoded}`;
        return type.startsWith('image/') ? missing : `data:${type};base64,`;
      }
    })());
    return cache.get(cacheKey)!;
  }
  async function transform(text: string, from: string, css = false, script = false): Promise<string> {
    if (css) {
      text=await replaceAsync(text,/@import\s+(['"])([^'"]+)\1/gi,async match=>`@import url("${await asset(match[2],from,true)}")`);
      text = await replaceAsync(text, /url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi, async match => `url("${await asset(match[2], from,true)}")`);
    }
    if(!css)text=await replaceAsync(text,/(\b(?:from|import)\s*)(['"])((?:https?:)?\/\/[^'"]+)\2/g,async match=>`${match[1]}${match[2]}${await asset(match[3],from,true)}${match[2]}`);
    return replaceAsync(text, /(["'`])((?:https?:\/\/|\.{0,2}\/)?[^"'`\s<>]*\.(?:js|css|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf|mp4|mp3)(?:[?#][^"'`\s<>]*)?)\1/gi, async match => `${match[1]}${await asset(match[2], from, false, script)}${match[1]}`);
  }
  return async (path: string) => {
    const file = await contained(root, resolve(site, path));
    documentFile = file;
    let html = await readFile(file, 'utf8');
    // Fetch external scripts/styles at the backend, including extensionless URLs.
    html=await replaceAsync(html,/<(?:script|link)\b[^>]*>/gi,async match=>{
      if(/^<link/i.test(match[0])&&/\brel\s*=\s*["'](?:preconnect|dns-prefetch)["']/i.test(match[0]))return '';
      if(/^<link/i.test(match[0])&&!/\brel\s*=\s*["']stylesheet["']/i.test(match[0]))return match[0];
      const tag=await replaceAsync(match[0],/\b(src|href)\s*=\s*(["'])([^"']+)\2/gi,async attr=>`${attr[1]}=${attr[2]}${await asset(attr[3],file,true)}${attr[2]}`);
      return tag.replace(/\s+(?:integrity|crossorigin)\s*=\s*(["'])[^"']*\1/gi,'');
    });
    html = html.replace(/<meta\b[^>]*>/gi, tag => /http-equiv\s*=\s*["']?refresh\b/i.test(tag) ? '' : tag);
    html = html.replace(/\b(on\w+)\s*=\s*(["'])([\s\S]*?)\2/gi, (_match,name,quote,handler) => {
      const source = handler.replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&amp;','&');
      const rewritten = previewScript(source).replaceAll('&','&amp;').replaceAll(quote,quote === '"' ? '&quot;' : '&#39;');
      return `${name}=${quote}${rewritten}${quote}`;
    });
    // Only preview response bytes are transformed; source files remain read-only.
    html = await replaceAsync(html, /\b(src|href)\s*=\s*(["'])([^"']+)\2/gi, async match => {
      if (/\.html?(?:[?#]|$)/i.test(match[3])) return match[0];
      return `${match[1]}=${match[2]}${await asset(match[3], file)}${match[2]}`;
    });
    html = await replaceAsync(html, /\bsrcset\s*=\s*(["'])([^"']+)\1/gi, async match => {
      if(/data:/i.test(match[2]))return match[0];
      const candidates=await Promise.all(match[2].split(',').map(async candidate=>{
        const [url,...descriptor]=candidate.trim().split(/\s+/);
        return [await asset(url,file),...descriptor].join(' ');
      }));
      return `srcset=${match[1]}${candidates.join(', ')}${match[1]}`;
    });
    // CDN Tailwind is extensionless, so handle it explicitly before inline scripts.
    for (const remote of (process.env.WEBSITE_BUILDER_PREVIEW_VENDOR_FIXTURES==='1'?Object.keys(vendors):[])) html = html.replaceAll(remote.replaceAll('&','&amp;'), await asset(remote, file)).replaceAll(remote, await asset(remote, file));
    html = await replaceAsync(html, /<script\b([^>]*)>([\s\S]*?)<\/script>/gi, async match => `<script${match[1]}>${await transform(previewScript(match[2]), file, false, true)}</script>`);
    html = await replaceAsync(html, /<style\b([^>]*)>([\s\S]*?)<\/style>/gi, async match => `<style${match[1]}>${await transform(match[2], file, true)}</style>`);
    html=await replaceAsync(html,/\bstyle\s*=\s*(["'])([\s\S]*?)\1/gi,async match=>/url\(/i.test(match[2])?`style=${match[1]}${(await transform(match[2],file,true)).replaceAll(match[1],match[1]==='"'?'&quot;':'&#39;')}${match[1]}`:match[0]);
    // Images/media are transferred lazily over the UI proxy channel, keeping
    // large binaries out of page payloads and preventing any direct CDN request.
    html=html.replace(/<(?:img|source|video|audio|track|input|object|embed)\b[^>]*>/gi,tag=>tag.replace(/\b(src|srcset|poster|data)\s*=\s*(["'])([^"']+)\2/gi,(attribute,name,quote,value)=>/^(?:https?:)?\/\//i.test(value)?`data-wb-${name}=${quote}${value}${quote}`:attribute));
    return html;
  };
}
