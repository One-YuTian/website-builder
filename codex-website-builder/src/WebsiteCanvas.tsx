import { memo, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { SiteManifest, SitePage } from '../server/preview';
import { hostApp, hostReady } from './bridge';
import { Icon } from './Icons';
import {readResource} from './resources';

type View = { x: number; y: number; zoom: number };
type Wheel = { dx: number; dy: number; zoom: boolean; x: number; y: number };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

async function decodePagePayload(value: string | {resource:string}) {
  const bytes=typeof value==='string'?Uint8Array.from(atob(value),char=>char.charCodeAt(0)):new Uint8Array(await (await fetch((await readResource(value.resource,true)).data)).arrayBuffer());
  return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
}

const PageFrame = memo(function PageFrame({ page, storage, index, width, selected, select, wheel, notify }: {
  page: SitePage; index: number; width: number; selected: boolean; select: (path: string) => void;
  wheel: (value: Wheel) => void; notify: (text: string) => void;
  storage: { current: Record<string, string> };
}) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const acknowledged = useRef(false);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [height, setHeight] = useState(900);
  const maxHeight = Math.floor(width * (width < 768 ? 5 : width <= 1024 ? 3 : 2.5));
  const viewportHeight = Math.min(height, maxHeight);
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState('');
  const currentUrl = page.url;
  const [src, setSrc] = useState('');
  const pending = !!page.status && page.status !== 'ready';
  const snapshot = pending ? undefined : page.html;
  useEffect(() => {
    acknowledged.current=false;if(loadTimer.current)clearTimeout(loadTimer.current);
    if (!snapshot) {setSrc('');setReady(false);if(loadTimer.current)clearTimeout(loadTimer.current);return;}
    const escape = (value: unknown) => JSON.stringify(value).replaceAll('<', '\\u003c');
    const html = snapshot.replaceAll('"__WEBSITE_BUILDER_VIRTUAL_URL__"', escape(currentUrl)).replaceAll('"__WEBSITE_BUILDER_STORAGE__"', escape(storage.current)).replaceAll('__WEBSITE_BUILDER_BASE_URL__', currentUrl.replaceAll('&','&amp;').replaceAll('"','&quot;'));
    const blob = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    setSrc(blob); setReady(false);
    return () => URL.revokeObjectURL(blob);
  }, [snapshot, currentUrl, storage]);
  useEffect(() => { setReady(false); setHeight(900); setCurrent(''); }, [page.url]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== iframe.current?.contentWindow || event.origin !== 'null') return;
      const data = event.data;
      if(data?.type==='website-builder:resource'&&typeof data.url==='string'&&Number.isSafeInteger(data.id)){
        const source=event.source as Window;
        void readResource(data.url,!!data.raw).then(value=>source.postMessage({type:'website-builder:resource-result',id:data.id,...value},'*')).catch(error=>source.postMessage({type:'website-builder:resource-result',id:data.id,error:(error as Error).message},'*'));
      }
      if(data?.type==='website-builder:resource-error')notify(`资源代理加载失败：${data.error}`);
      if (data?.type === 'website-builder:height' && Number.isFinite(data.height) && data.height > 0) {
        acknowledged.current = true;
        setHeight(Math.max(200, Math.ceil(data.height))); setReady(true);
      }
      if (data?.type === 'website-builder:location' && typeof data.path === 'string') setCurrent(decodeURIComponent(data.path.split('/').pop() || ''));
      if (data?.type === 'website-builder:blocked' && typeof data.url === 'string') notify(`已阻止页面跳转：${data.url}`);
      if (data?.type === 'website-builder:navigate' && typeof data.url === 'string') {
        notify(`已阻止页面跳转：${data.url}`);
      }
      if (data?.type === 'website-builder:storage' && data.value && typeof data.value === 'object') {
        storage.current = Object.fromEntries(Object.entries(data.value).filter((entry): entry is [string,string] => typeof entry[1] === 'string'));
        document.querySelectorAll('iframe').forEach(frame => frame.contentWindow?.postMessage({ type: 'website-builder:storage-sync', value: storage.current }, '*'));
      }
      if (data?.type === 'website-builder:wheel' && [data.dx, data.dy, data.x, data.y].every(Number.isFinite)) {
        const rect = iframe.current!.getBoundingClientRect(), scale = rect.width / width;
        wheel({ dx: data.dx, dy: data.dy, zoom: !!data.zoom, x: rect.left + data.x * scale, y: rect.top + data.y * scale });
      }
      if(data?.type === 'website-builder:scroll-to' && Number.isFinite(data.y)) {
        const rect=iframe.current!.getBoundingClientRect();wheel({dx:0,dy:data.y*rect.width/width,zoom:false,x:rect.left,y:rect.top});
      }
      if (data?.type === 'website-builder:focus') select(page.path);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [page.url, page.path, width, wheel, notify, select, storage]);
  useEffect(() => { iframe.current?.contentWindow?.postMessage({ type: 'website-builder:measure', capped: height > maxHeight }, '*'); }, [width, page.url, height, maxHeight]);
  useEffect(() => () => { if(loadTimer.current)clearTimeout(loadTimer.current); }, []);
  return <article className={`page-panel ${selected ? 'is-selected' : ''}`} data-page={page.path} style={{ width }}>
    <button className="page-label" onClick={() => select(page.path)} title={`${page.path} - ${page.title}`}>
      <span className="page-icon"><Icon name="pages" /></span><span className="page-title">{page.path} - {page.title}</span><span className="page-number">{String(index + 1).padStart(2, '0')}</span>
    </button>
    <div className={`frame-glass ${ready ? 'is-ready' : 'is-loading'}`} style={{ height: viewportHeight }}>
    {!ready && <div className="page-loader" role="progressbar" aria-label={`正在加载 ${page.path}`} />}
    {src && <iframe ref={iframe} title={page.path} src={src} sandbox="allow-scripts allow-forms" scrolling="auto" style={{ width, height: viewportHeight }} onLoad={() => {
      acknowledged.current = false;
      iframe.current?.contentWindow?.postMessage({ type: 'website-builder:measure' }, '*');
      if(loadTimer.current)clearTimeout(loadTimer.current);
      loadTimer.current = setTimeout(() => {
        if(!acknowledged.current && iframe.current) { notify('已阻止离开本地页面，正在恢复预览'); iframe.current.src = src; }
      }, 3000);
    }} />}
    </div>
    <div className="page-caption" data-ready={ready} title={page.error}>{width} × {viewportHeight}{height > maxHeight ? ' · 页面内滚动' : ''} {page.status==='error'?`· 生成失败：${page.error}`:pending?`· ${page.status==='queued'?'等待生成':'正在生成'}`:ready?'':'· 加载中'}</div>
  </article>;
});

export function WebsiteCanvas({ background, projectId: pinnedProjectId, threadId, onHome, onFolder, onProject }: { background: ReactNode; projectId?:string; threadId?:string; onHome?:()=>void; onFolder?:()=>void; onProject?:(id:string)=>void }) {
  const config = window.__WEBSITE_BUILDER__;
  const [site, setSite] = useState<SiteManifest | null>(null);
  const [directory, setDirectory] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [popover, setPopover] = useState<'width'|'pages'|'zoom'|null>(null);
  const storage = useRef<Record<string, string>>({});
  const [width, setWidth] = useState(1280);
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState('index.html');
  const [view, setView] = useState<View>({ x: 28, y: 30, zoom: .26 });
  const [panMode, setPanMode] = useState(false);
  const [dragging, setDragging] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const columns = width > 1024 ? 5 : 7;
  const drag = useRef<{ x: number; y: number; view: View } | null>(null);
  const sequence = useRef(0);
  const projectMode=useRef(false);
  const [projectList,setProjectList]=useState<{id:string;name:string}[]>([]);
  const load = useCallback(async (directory: string) => {
    const id = ++sequence.current;
    setLoading(true); setError(''); setNotice('');
    try {
      if (!config) throw new Error('请通过插件入口或 pnpm preview 打开完整画布。');
      let data: SiteManifest;
      if (hostApp) {
        await hostReady;
        const result = await hostApp.callServerTool({ name: 'read_website', arguments: { directory } });
        if (result.isError || !result._meta?.website) throw new Error(result.content?.filter(item => item.type === 'text').map(item => 'text' in item ? item.text : '').join(' ') || '网站读取失败');
        data = result._meta.website as unknown as SiteManifest;
        // Keep individual protocol messages below transport limits and retain all live frames.
        const pages = [...data.pages];
        for (let start = 0; start < pages.length; start += 3) {
          await Promise.all(pages.slice(start,start+3).map(async page => {
            const result = await hostApp!.callServerTool({ name:'read_page', arguments:{directory,path:page.path} });
            if (result.isError || !result._meta?.gzip) throw new Error(`读取 ${page.path} 失败`);
            page.html = await decodePagePayload(result._meta.gzip as string | {resource:string});
          }));
          if (id !== sequence.current) return;
        }
        data = {...data,pages};
      } else {
        const url = new URL(config.api); url.searchParams.set('directory', directory); url.searchParams.set('embedded','1');
        const response = await fetch(url), result = await response.json();
        if (!response.ok) throw new Error(result.error || '网站识别失败');
        data = result;
      }
      if (id !== sequence.current) return;
      setSite(previous => ({...data,pages:data.pages.map(page=>{
        const old=previous?.directory===data.directory?previous.pages.find(item=>item.path===page.path):undefined;
        return old&&old.html===page.html&&old.title===page.title&&old.url===page.url?old:page;
      })}));
    } catch (error) { if (id === sequence.current) setError((error as Error).message); }
    finally { if (id === sequence.current) setLoading(false); }
  }, [config]);
  useEffect(()=>{
    if(!config)return;
    let stopped=false,probed=false,since='none',projectId='';let known:Record<string,number>={};
    const controller=new AbortController();
    const unzip=decodePagePayload;
    async function run(){
      if(hostApp)await hostReady;
      while(!stopped){
        try{
          let value:any;
          if(hostApp){const result=await hostApp.callServerTool({name:'project_sync',arguments:{since,known,thread_id:threadId,project_id:pinnedProjectId,wait_ms:probed?20000:0}},{signal:controller.signal,timeout:25000});if(result.isError)throw new Error('项目状态读取失败');value=result._meta?.sync;}
          else if(config!.projectApi){const url=new URL(config!.projectApi);url.searchParams.set('since',since);url.searchParams.set('known',JSON.stringify(known));url.searchParams.set('wait',probed?'20000':'0');if(threadId)url.searchParams.set('thread_id',threadId);if(pinnedProjectId)url.searchParams.set('project_id',pinnedProjectId);const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw new Error('项目状态读取失败');value=await response.json();}
          else return;
          if(stopped)return;
          if(!value)throw new Error('项目状态响应无效');
          if(value.unchanged){probed=true;continue;}
          probed=true;
          const manifest=value.manifest as SiteManifest;
          if(!manifest?.projectId){if(projectMode.current){setSite(null);projectMode.current=false;projectId='';known={};}since=value.revision||'none';continue;}
          const changed=manifest.projectId!==projectId;
          if(changed){known={};projectId=manifest.projectId;sequence.current++;projectMode.current=true;storage.current={};setWidths({});setSelected(manifest.pages[0]?.path||'');setView({x:28,y:30,zoom:.26});}
          const decoded:Record<string,string>={},nextKnown={...known},decodeErrors:Record<string,string>={};
          for(const [path,payload]of Object.entries(value.pages||{})){
            try{decoded[path]=await unzip(payload as string | {resource:string});const page=manifest.pages.find(item=>item.path===path);if(page)nextKnown[path]=page.version||0;}
            catch(error){decodeErrors[path]=`预览传输失败，正在重试：${(error as Error).message}`;}
          }
          for(const path of Object.keys(value.errors||{})){const page=manifest.pages.find(item=>item.path===path);if(page)nextKnown[path]=page.version||0;}
          if(stopped)return;
          setSite(previous=>({...manifest,pages:manifest.pages.map(page=>{
            const old=!changed?previous?.pages.find(item=>item.path===page.path):undefined;
            const failure=value.errors?.[page.path]||decodeErrors[page.path];
            const next={...page,...(failure?{status:'error' as const,error:failure}:{}),html:page.status==='ready'?(decoded[page.path]??(old?.version===page.version?old?.html:undefined)):undefined};
            return old&&Object.keys({...old,...next}).every(key=>old[key as keyof SitePage]===next[key as keyof SitePage])?old:next;
          })}));
          setDirectory(manifest.directory);setProjectList(value.projects||[]);setError('');setLoading(false);known=nextKnown;since=value.revision;
          if(Object.keys(decodeErrors).length)await new Promise(resolve=>setTimeout(resolve,1000));
        }catch(error){if(stopped)return;probed=true;setNotice((error as Error).message);await new Promise(resolve=>setTimeout(resolve,3000));}
      }
    }
    void run();return()=>{stopped=true;controller.abort();};
  },[config,pinnedProjectId,threadId]);
  const refreshView=async()=>{
    if(projectMode.current){setNotice('项目预览已实时同步；生成完成后会自动更新。');return;}
    if(site)await load(directory);
  };
  const switchProject=async(id:string)=>{
    if(onProject){onProject(id);return;}
    if(!site?.threadId||!hostApp){setNotice('请在当前会话中指定要打开的项目');return;}
    const result=await hostApp.callServerTool({name:'website_project',arguments:{action:'open',thread_id:site.threadId,project_id:id}});
    if(result.isError)setNotice('无法打开该项目');
  };
  const wheel = useCallback((event: Wheel) => {
    if (event.zoom) {
      const bounds = stage.current?.getBoundingClientRect(); if (!bounds) return;
      const x = event.x - bounds.left, y = event.y - bounds.top;
      setView(current => {
        const zoom = clamp(current.zoom * Math.exp(-event.dy * .002), .02, 1.5);
        return { x: x - (x - current.x) * zoom / current.zoom, y: y - (y - current.y) * zoom / current.zoom, zoom };
      });
    } else setView(current => ({ ...current, x: current.x - event.dx, y: current.y - event.dy }));
  }, []);
  useEffect(() => {
    const element = stage.current; if (!element) return;
    const onWheel = (event: WheelEvent) => { event.preventDefault(); wheel({ dx: event.shiftKey ? event.deltaY : event.deltaX, dy: event.shiftKey ? 0 : event.deltaY, x: event.clientX, y: event.clientY, zoom: event.ctrlKey || event.metaKey }); };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [wheel]);
  const changeZoom = (zoom: number) => {
    const bounds = stage.current?.getBoundingClientRect(); if (!bounds) return;
    const x = bounds.width / 2, y = bounds.height / 2;
    setView(current => ({ x: x - (x - current.x) * zoom / current.zoom, y: y - (y - current.y) * zoom / current.zoom, zoom }));
  };
  const focusPage = (path: string) => {
    setSelected(path);
    const panel = Array.from(world.current?.children || []).find(element => (element as HTMLElement).dataset.page === path) as HTMLElement | undefined;
    if (panel) setView(current => ({ ...current, x: 28 - panel.offsetLeft * current.zoom, y: 30 - panel.offsetTop * current.zoom }));
  };
  const fitAll = () => {
    const count = site?.pages.length ?? 0, viewport = stage.current; if (!count || !viewport) return;
    if (!world.current) return;
    const rows = Math.ceil(count / columns), fixedLabels = rows * 52;
    const scalableHeight = Math.max(1, world.current.offsetHeight - fixedLabels / view.zoom);
    const zoom = Math.min((viewport.clientWidth - 120) / world.current.offsetWidth, (viewport.clientHeight - 70 - fixedLabels) / scalableHeight);
    setView({ x: 28, y: 30, zoom: clamp(zoom, .02, 1) });
  };
  const move = (direction: number) => setSite(current => {
    if (!current) return current;
    const pages = [...current.pages], index = pages.findIndex(page => page.path === selected), next = index + direction;
    if (next < 0 || next >= pages.length) return current;
    [pages[index], pages[next]] = [pages[next], pages[index]]; return { ...current, pages };
  });
  return <main aria-label="网站展示画布">
    <div className="workspace">
      <section className="canvas-area">
        {error && <div className="message error" role="alert">{error}</div>}
        {notice && <div className="message" role="status">{notice}<button aria-label="关闭提示" onClick={() => setNotice('')}>×</button></div>}
        <div ref={stage} className={`page-stage ${panMode ? 'pan-mode' : ''} ${dragging ? 'dragging' : ''}`} aria-label="可平移缩放的网页画布" aria-busy={loading}
          style={{ '--canvas-scale': view.zoom, backgroundPosition: `${view.x}px ${view.y}px` } as CSSProperties}
          onPointerDown={event => {
            if (event.button !== 1 && !panMode && event.target !== event.currentTarget && !(event.target as HTMLElement).classList.contains('canvas-world')) return;
            if (event.button !== 0 && event.button !== 1) return;
            event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { x: event.clientX, y: event.clientY, view }; setDragging(true);
          }}
          onPointerMove={event => { if (drag.current) setView({ ...drag.current.view, x: drag.current.view.x + event.clientX - drag.current.x, y: drag.current.view.y + event.clientY - drag.current.y }); }}
          onPointerUp={() => { drag.current = null; setDragging(false); }} onPointerCancel={() => { drag.current = null; setDragging(false); }}>
          {background}
          {!site && loading && <div className="empty-state"><div className="canvas-loader" role="progressbar" aria-label="正在载入网站页面" /></div>}
          <div ref={world} className="canvas-world" data-columns={columns} style={{ gridTemplateColumns: `repeat(${columns}, max-content)`, transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}>
            {site?.pages.map((page, index) => <PageFrame key={`${site.directory}/${page.path}`} page={page} storage={storage} index={index} width={widths[page.path] ?? width} selected={selected === page.path} select={setSelected} wheel={wheel} notify={setNotice} />)}
          </div>
          <nav className="tool-rail" aria-label="画布工具栏" onPointerDown={event => event.stopPropagation()}>
            <button aria-label="选择与交互" aria-pressed={!panMode} className={!panMode ? 'active' : ''} onClick={() => setPanMode(false)}><Icon name="select" /></button>
            <button aria-label="抓手平移" aria-pressed={panMode} className={panMode ? 'active' : ''} onClick={() => setPanMode(true)}><Icon name="hand" /></button>
            <button aria-label="查看全部" onClick={fitAll}><Icon name="fit" /></button>
            <button aria-label="页面宽度" aria-expanded={popover === 'width'} className={popover === 'width' ? 'open' : ''} onClick={() => setPopover(popover === 'width' ? null : 'width')}><Icon name="width" /></button>
            <button aria-label="页面目录" aria-expanded={popover === 'pages'} className={popover === 'pages' ? 'open' : ''} onClick={() => setPopover(popover === 'pages' ? null : 'pages')}><Icon name="pages" /></button>
            <button aria-label="刷新网站" disabled={loading} onClick={() => void refreshView()}><Icon name="refresh" /></button>
            <span className="rail-divider" />
            {onFolder&&<button aria-label="打开项目目录" title="打开项目目录" onClick={onFolder}><Icon name="folder"/></button>}
            <button aria-label="画布缩放" aria-expanded={popover === 'zoom'} className={popover === 'zoom' ? 'open' : ''} onClick={() => setPopover(popover === 'zoom' ? null : 'zoom')}><Icon name="zoom" /></button>
            <button aria-label="返回主界面" title="Home" onClick={onHome}><Icon name="reset" /></button>
          </nav>
          {popover && <div className={`tool-popover ${popover}`} role="dialog" aria-label={popover === 'width' ? '页面宽度设置' : popover === 'pages' ? '网站页面目录' : '画布缩放设置'} onPointerDown={event => event.stopPropagation()}>
            <div className="popover-heading"><strong>{popover === 'width' ? '页面宽度' : popover === 'pages' ? `网站页面 · ${site?.pages.length ?? 0}` : '画布缩放'}</strong><button aria-label="关闭工具面板" onClick={() => setPopover(null)}>×</button></div>
            {popover === 'width' && <><label>统一宽度<select aria-label="统一宽度" value={width} onChange={event => { setWidth(Number(event.target.value)); setWidths({}); }}><option value="375">手机 · 375 px</option><option value="768">平板 · 768 px</option><option value="1280">桌面 · 1280 px</option><option value="1440">宽屏 · 1440 px</option></select></label><p className="selected-file">当前：{selected}</p><label>单页宽度<input aria-label="当前页面宽度" type="number" min="320" max="2560" value={widths[selected] ?? width} onChange={event => { const value = event.target.valueAsNumber; if (value >= 320 && value <= 2560) setWidths(current => ({ ...current, [selected]: value })); }} />px</label><div className="order-buttons"><button aria-label="页面前移" onClick={() => move(-1)}>← 前移</button><button aria-label="页面后移" onClick={() => move(1)}>后移 →</button></div></>}
            {popover === 'pages' && <>{site?.projectId?<><label>当前项目<select aria-label="当前项目" value={site.projectId} onChange={event=>void switchProject(event.target.value)}>{projectList.map(project=><option key={project.id} value={project.id}>{project.name}</option>)}</select></label><p className="resource-note">在会话中描述需求即可生成网站；指定页面可单独修改或重新生成。</p></>:<form onSubmit={event => { event.preventDefault(); void load(directory); }}><label htmlFor="site-directory">网站目录</label><input id="site-directory" value={directory} onChange={event => setDirectory(event.target.value)} /><button disabled={loading}>识别网站</button></form>}<div className="page-list">{site?.pages.map((page,index) => <button className={selected === page.path ? 'current' : ''} key={page.path} onClick={() => focusPage(page.path)}>{String(index+1).padStart(2,'0')}<span>{page.path}</span>{page.status&&page.status!=='ready'?<small>{page.status==='queued'?'待生成':page.status==='generating'?'生成中':'失败'}</small>:null}</button>)}</div>{site?.warnings.map(text => <p className="resource-note" key={text}>{text}</p>)}</>}
            {popover === 'zoom' && <><div className="zoom-row"><button aria-label="缩小画布" onClick={() => changeZoom(clamp(view.zoom / 1.25, .02, 1.5))}>−</button><span>{Math.round(view.zoom*100)}%</span><button aria-label="放大画布" onClick={() => changeZoom(clamp(view.zoom*1.25,.02,1.5))}>+</button></div><input aria-label="缩放比例" type="range" min="2" max="150" value={view.zoom*100} onChange={event => changeZoom(Number(event.target.value)/100)} /><button className="full-button" onClick={fitAll}>所有页面适合画布</button></>}
          </div>}
          <div className="canvas-help">空白处拖动画布 · 滚轮平移 · Ctrl / ⌘ + 滚轮缩放 · 页面内直接交互</div>
        </div>
      </section>
    </div>
  </main>;
}
