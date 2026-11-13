import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { ProjectStore } from './projects';
import { contained } from './preview';
import { proxyResource } from './resource-proxy';

const mime: Record<string, string> = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.avif':'image/avif', '.gif':'image/gif', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.woff':'font/woff', '.woff2':'font/woff2', '.ttf':'font/ttf' };

export async function screenshotPage(store: ProjectStore, input: {thread_id?:string;project_id:string;path:string;width?:number;thumbnail?:boolean;signal?:AbortSignal;snapshot?:string}) {
  if(input.signal?.aborted)throw Error('截图已取消');
  const view = await store.get(input.thread_id,input.thread_id?undefined:input.project_id);
  if (!view || view.project.id !== input.project_id) throw new Error('当前会话项目不匹配');
  const planned = view.project.pages.find(page => page.path === input.path.split(/[?#]/)[0]);
  if (!planned || planned.status !== 'ready') throw new Error('页面不存在或尚未生成完成');
  const width = input.width ?? 1280;
  if (!Number.isInteger(width) || width < 320 || width > 2560) throw new Error('width 必须为320–2560');
  const runtime = new URL('../runtime/playwright-core/index.mjs', import.meta.url).href;
  const { chromium } = await import(/* @vite-ignore */ runtime);
  const vendor = fileURLToPath(new URL('../vendor/', import.meta.url));
  const vendors: Record<string,string> = JSON.parse(await readFile(join(vendor,'manifest.json'),'utf8'));
  const token = randomBytes(24).toString('hex');
  const prefix = `/${token}/`;
  const service = createServer(async (req,res) => {
    try {
      const url = new URL(req.url!, 'http://localhost');
      if (req.method !== 'GET' || !url.pathname.startsWith(prefix)) { res.writeHead(404).end(); return; }
      const name = decodeURIComponent(url.pathname.slice(prefix.length));
      if(input.snapshot&&name===input.path.split(/[?#]/)[0]) {
        res.setHeader('Content-Type','text/html; charset=utf-8');
        res.setHeader('Content-Security-Policy',"script-src 'none'; object-src 'none'; base-uri 'none'");
        res.end(input.snapshot.replace(/<base\b[^>]*>/gi,''));return;
      }
      if (name.split('/').some(part => part.startsWith('.')) || name.includes('\\')) throw Error('不可读取此路径');
      const file = await contained(view.directory, name);
      res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
      res.end(await readFile(file));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise<void>(resolve => service.listen(0,'127.0.0.1',resolve));
  const origin = `http://127.0.0.1:${(service.address() as import('node:net').AddressInfo).port}`;
  let browser: any;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancel: (()=>void) | undefined;
  try {
    browser = await chromium.launch({channel:'chrome',headless:true});
    if(input.signal?.aborted)throw Error('截图已取消');
    const work = async () => {
      const page = await browser.newPage({viewport:{width,height:input.thumbnail?width:900},deviceScaleFactor:1});
      page.setDefaultTimeout(15000);
      const failures = new Set<string>();
      page.on('pageerror',(error:Error)=>failures.add(error.message));
      page.on('response',(response:any)=>{if(response.status()>=400)failures.add(`${response.status()} ${response.url()}`);});
      page.on('requestfailed',(request:any)=>failures.add(`加载失败 ${request.url()}`));
      await page.route('**/*', async (route:any) => {
        const request = route.request(), url = request.url();
        // Screenshot rendering never sends forms, commerce mutations or outside navigations.
        if (request.method() !== 'GET' || request.isNavigationRequest() && !url.startsWith(origin + prefix)) { await route.abort(); return; }
        if (url.startsWith(origin + prefix)) { await route.continue(); return; }
        try {
          if (vendors[url] && process.env.WEBSITE_BUILDER_PREVIEW_VENDOR_FIXTURES==='1') await route.fulfill({body:await readFile(await contained(vendor,vendors[url])),contentType:mime[extname(vendors[url])]});
          else { const resource = await proxyResource(url); await route.fulfill({body:resource.bytes,contentType:resource.mime}); }
        } catch(error) { failures.add((error as Error).message); await route.abort(); }
      });
      await page.goto(origin + prefix + input.path,{waitUntil:'load',timeout:30000});
      if(input.snapshot)await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}'});
      // Applications with async data/rendering must publish this promise in app.js.
      await page.evaluate(async (snapshot:boolean) => {
        if(!snapshot){await (window as any).websiteReady;
        await Promise.all([...new Set([...document.querySelectorAll('*')].map(el=>el.localName).filter(name=>name.includes('-')))].map(name=>customElements.whenDefined(name)));}
        await document.fonts.ready;
      },!!input.snapshot);
      await page.waitForLoadState('networkidle',{timeout:15000});
      await page.evaluate(async () => {
        document.querySelectorAll('img').forEach(image=>image.loading='eager');
        let lastHeight=0, stable=0;
        for(let step=0;step<100;step++) {
          const height=document.documentElement.scrollHeight;
          window.scrollTo(0,Math.min(step*700,height));
          await new Promise(resolve=>setTimeout(resolve,60));
          if(step*700>=height && height===lastHeight) stable++; else stable=0;
          if(stable>=3)break;
          lastHeight=height;
          if(step===99)throw Error('懒加载页面未收敛，无法截取完整图片');
        }
        await Promise.all([...document.images].map(async image=>{await image.decode(); if(!image.naturalWidth)throw Error(`图片未加载: ${image.currentSrc}`);}));
        const urls=new Set<string>();
        document.querySelectorAll('*').forEach(element=>{
          const image=getComputedStyle(element).backgroundImage;
          for(const match of image.matchAll(/url\(["']?(.*?)["']?\)/g))urls.add(match[1]);
        });
        await Promise.all([...urls].map(url=>new Promise<void>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve();image.onerror=()=>reject(Error(`背景图片未加载: ${url}`));image.src=url;})));
        window.scrollTo(0,0);
      });
      await page.waitForLoadState('networkidle',{timeout:15000});
      let previous='', stable=0;
      for(let attempt=0;attempt<40 && stable<4;attempt++) {
        const signature = await page.evaluate(()=>JSON.stringify({height:document.documentElement.scrollHeight,text:document.body.innerText,images:[...document.images].map(image=>image.currentSrc),boxes:[...document.body.querySelectorAll('*')].map(el=>{const r=el.getBoundingClientRect();return [r.x,r.y,r.width,r.height];})}));
        stable=signature===previous?stable+1:0; previous=signature;
        await page.waitForTimeout(150);
      }
      if(stable<4)throw Error('页面布局尚未稳定');
      if(failures.size)throw Error(`页面未完整渲染：${[...failures].slice(0,5).join('; ')}`);
      let bytes: Buffer = await page.screenshot(input.thumbnail?{clip:{x:0,y:0,width,height:width},type:'png',animations:'disabled'}:{fullPage:true,type:'png',animations:'disabled'});
      if(input.thumbnail) {
        const data = await page.evaluate(async (values:number[]) => {
          const image = await createImageBitmap(new Blob([new Uint8Array(values)],{type:'image/png'}));
          const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
          canvas.getContext('2d')!.drawImage(image,0,0,256,256);image.close();
          return canvas.toDataURL('image/png').split(',')[1];
        },Array.from(bytes));
        bytes=Buffer.from(data,'base64');
      }
      const path = join(view.metadataDirectory,'artifacts/screenshots',`${input.path.split(/[?#]/)[0].replace(/[^a-zA-Z0-9_-]/g,'-')}-${width}-${Date.now()}-${randomBytes(3).toString('hex')}.png`);
      await mkdir(dirname(path),{recursive:true}); await writeFile(path,bytes);
      return {path,width,page:input.path,bytes};
    };
    return await Promise.race([work(), new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('完整页面截图超时：未获得加载完成的稳定页面')),60000);}),new Promise<never>((_,reject)=>{cancel=()=>reject(Error('截图已取消'));input.signal?.addEventListener('abort',cancel,{once:true});})]);
  } finally {
    if(cancel)input.signal?.removeEventListener('abort',cancel);
    if(timer)clearTimeout(timer);
    if(browser)await browser.close();
    service.closeAllConnections(); await new Promise<void>(resolve=>service.close(()=>resolve()));
  }
}
