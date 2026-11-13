// Injected into preview bytes only, before any website scripts execute.
export const proxyRuntime=String.raw`<script>
(()=>{
 const lockInteractions=root=>{const block=event=>{event.preventDefault();event.stopImmediatePropagation();};root.addEventListener('selectstart',block,true);root.addEventListener('contextmenu',block,true);};
 lockInteractions(window);
 const requests=new Map(),cached=new Map(),originalURLs=new Map();let sequence=0;
 const remote=value=>{try{const url=new URL(String(value),window.__websiteBuilderLocation);return /^https?:$/.test(url.protocol)&&(url.hostname!=='website-builder.invalid'||url.pathname.startsWith('/preview-assets/'))?url.href:null;}catch{return null;}};
 const request=(url,raw=false)=>{
  const key=(raw?'raw:':'asset:')+url;if(cached.has(key))return cached.get(key);
  const promise=new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{requests.delete(id);reject(new Error('资源代理超时：'+url));},60000);requests.set(id,{resolve,reject,timer});parent.postMessage({type:'website-builder:resource',id,url,raw},'*');});
  cached.set(key,promise);promise.catch(()=>cached.delete(key));return promise;
 };
 addEventListener('message',event=>{if(event.source!==parent||event.data?.type!=='website-builder:resource-result')return;const pending=requests.get(event.data.id);if(!pending)return;clearTimeout(pending.timer);requests.delete(event.data.id);if(event.data.error)pending.reject(new Error(event.data.error));else pending.resolve(event.data);});
 const fail=error=>parent.postMessage({type:'website-builder:resource-error',error:String(error.message||error)},'*');
 const dataURI=async url=>{const value=(await request(url)).data;originalURLs.set(value,url);return value;};
 addEventListener('message',async event=>{
  if(event.source!==parent||event.data?.type!=='website-builder:capture')return;
  const id=event.data.id;
  try{
   await window.websiteReady;
   await Promise.all([...new Set([...document.querySelectorAll('*')].map(element=>element.localName).filter(name=>name.includes('-')))].map(name=>customElements.whenDefined(name)));
   document.querySelectorAll('img').forEach(image=>image.loading='eager');
   await Promise.all([...cached.values()]);await document.fonts.ready;
   await Promise.all([...document.images].map(image=>image.decode()));
   const clone=new DOMParser().parseFromString(document.documentElement.outerHTML,'text/html');
   const mirror=(source,target)=>{
    const originals=[...source.querySelectorAll('*')],copies=[...target.querySelectorAll('*')];
    originals.forEach((element,index)=>{const copy=copies[index];if(!copy)return;
     if(element instanceof HTMLInputElement){copy.setAttribute('value',element.type==='password'?'•'.repeat(element.value.length):element.value);element.checked?copy.setAttribute('checked',''):copy.removeAttribute('checked');}
     if(element instanceof HTMLTextAreaElement)copy.textContent=element.value;
     if(element instanceof HTMLSelectElement)[...copy.options].forEach((option,i)=>element.options[i].selected?option.setAttribute('selected',''):option.removeAttribute('selected'));
     if(element instanceof HTMLDetailsElement)element.open?copy.setAttribute('open',''):copy.removeAttribute('open');
     if(element.tagName==='STYLE'){try{if(element.sheet)copy.textContent=[...element.sheet.cssRules].map(rule=>rule.cssText).join('\n');}catch{}}
     if(element.shadowRoot){const fragment=new DOMParser().parseFromString('<body>'+element.shadowRoot.innerHTML+'</body>','text/html');mirror(element.shadowRoot,fragment.body);const template=clone.createElement('template');template.setAttribute('shadowrootmode','open');template.content.append(...fragment.body.childNodes);copy.prepend(template);}
     if(element instanceof HTMLCanvasElement){const image=clone.createElement('img');for(const attr of copy.attributes)image.setAttribute(attr.name,attr.value);image.src=element.toDataURL('image/png');image.width=element.width;image.height=element.height;copy.replaceWith(image);}
     for(const attribute of [...copy.attributes]){
      if(/^on/i.test(attribute.name))copy.removeAttribute(attribute.name);
      else {let value=attribute.value;for(const [data,url]of originalURLs)if(value.includes(data))value=value.replaceAll(data,url);copy.setAttribute(attribute.name,value);}
     }
    });
   };
   mirror(document,clone);
   clone.querySelectorAll('script,iframe,object,embed,link[rel="icon"],meta[http-equiv="refresh"]').forEach(element=>element.remove());
   parent.postMessage({type:'website-builder:capture-result',id,html:'<!doctype html>'+clone.documentElement.outerHTML},'*');
  }catch(error){parent.postMessage({type:'website-builder:capture-result',id,error:String(error.message||error)},'*');}
 });
 window.__websiteBuilderImport=async url=>import(await dataURI(remote(url)||url));
 const nativeFetch=window.fetch.bind(window);
 window.fetch=async(input,options={})=>{
  const target=remote(typeof input==='string'||input instanceof URL?input:input.url);if(!target)return nativeFetch(input,options);
  const method=String(options.method||(input instanceof Request?input.method:'GET')).toUpperCase();if(!['GET','HEAD'].includes(method))throw new Error('预览资源代理仅支持 GET/HEAD，页面表单提交仍被阻止');
  if(options.signal?.aborted)throw new DOMException('Aborted','AbortError');
  const value=await request(target,true);const response=await nativeFetch(value.data);return new Response(method==='HEAD'?null:await response.arrayBuffer(),{status:value.status||200,headers:{'Content-Type':value.mime}});
 };
 const nativeOpen=XMLHttpRequest.prototype.open,nativeSend=XMLHttpRequest.prototype.send,nativeAbort=XMLHttpRequest.prototype.abort,network=new WeakMap();
 XMLHttpRequest.prototype.open=function(method,url,...args){const target=remote(url);if(!target)return nativeOpen.call(this,method,url,...args);if(!['GET','HEAD'].includes(String(method).toUpperCase()))throw new Error('预览代理不发送写入请求');if(args[0]===false)throw new Error('预览代理不支持同步 XMLHttpRequest');network.set(this,{url:target,method,cancelled:false});return nativeOpen.call(this,'GET','data:text/plain,',true);};
 XMLHttpRequest.prototype.send=function(body){const state=network.get(this);if(!state)return nativeSend.call(this,body);const xhr=this;request(state.url,true).then(async value=>{if(state.cancelled)return;const response=await nativeFetch(value.data),buffer=await response.arrayBuffer(),text=new TextDecoder().decode(buffer);const result=xhr.responseType==='arraybuffer'?buffer:xhr.responseType==='blob'?new Blob([buffer],{type:value.mime}):xhr.responseType==='json'?JSON.parse(text):text;for(const [key,data]of Object.entries({readyState:4,status:value.status,statusText:'OK',responseURL:state.url,response:result,responseText:text}))Object.defineProperty(xhr,key,{configurable:true,value:data});xhr.getResponseHeader=name=>name.toLowerCase()==='content-type'?value.mime:null;xhr.getAllResponseHeaders=()=>'content-type: '+value.mime+'\r\n';xhr.dispatchEvent(new Event('readystatechange'));xhr.dispatchEvent(new ProgressEvent('load'));xhr.dispatchEvent(new ProgressEvent('loadend'));}).catch(error=>{if(state.cancelled)return;fail(error);xhr.dispatchEvent(new ProgressEvent('error'));xhr.dispatchEvent(new ProgressEvent('loadend'));});};
 XMLHttpRequest.prototype.abort=function(){const state=network.get(this);if(state)state.cancelled=true;return nativeAbort.call(this);};
 const nativeSet=Element.prototype.setAttribute,versions=new WeakMap();
 // MutationObserver runs after insertion, too late to prevent an img request.
 // Neutralize network attributes in HTML strings before the browser parses them.
 const markup=value=>String(value).replace(/<(?:img|source|video|audio|track|input|object|embed)\b[^>]*>/gi,tag=>tag.replace(/(\s)(src|srcset|poster|data)\s*=\s*(["'])([^"']+)\3/gi,(attribute,space,name,quote,url)=>{
  const target=name.toLowerCase()==='srcset'?/(?:^|,\s*)\s*(?:https?:)?\/\//i.test(url):remote(url.replaceAll('&amp;','&'));
  return target?space+'data-wb-'+name+'='+quote+url+quote:attribute;
 }));
 for(const type of [Element,typeof ShadowRoot==='undefined'?null:ShadowRoot]){
  if(!type)continue;const descriptor=Object.getOwnPropertyDescriptor(type.prototype,'innerHTML');
  if(descriptor?.set)Object.defineProperty(type.prototype,'innerHTML',{...descriptor,set(value){descriptor.set.call(this,markup(value));if(this.querySelectorAll)this.querySelectorAll('*').forEach(scan);}});
 }
 const adjacent=Element.prototype.insertAdjacentHTML;
 Element.prototype.insertAdjacentHTML=function(position,value){return adjacent.call(this,position,markup(value));};
 const resourceAttribute=(element,name)=>['src','srcset','poster','data'].includes(name)&&/^(IMG|SOURCE|VIDEO|AUDIO|TRACK|INPUT|SCRIPT|IFRAME|EMBED|OBJECT)$/.test(element.tagName)||name==='href'&&element.tagName==='LINK';
 const rewriteList=async value=>{
  const items=[];let index=0;
  while(index<value.length){while(/[\s,]/.test(value[index]||'')&&index<value.length)index++;const start=index,isData=value.slice(index,index+5)==='data:';while(index<value.length&&!/\s/.test(value[index])&&(isData||value[index]!==','))index++;let url=value.slice(start,index).replace(/,+$/,'');let descriptor='';if(value[index]!==','){const from=index;while(index<value.length&&value[index]!==',')index++;descriptor=value.slice(from,index).trim();}index++;if(url){const target=remote(url);items.push([target?await dataURI(target):url,descriptor].filter(Boolean).join(' '));}}
  return items.join(', ');
 };
 const assign=(element,name,value)=>{
  if(element.tagName==='LINK'&&/^(?:preconnect|dns-prefetch)$/i.test(element.rel)){element.removeAttribute('href');return true;}
  const target=name==='srcset'?/(?:^|,\s*)\s*(?:https?:)?\/\//i.test(value):remote(value);if(!target)return false;
  let tokens=versions.get(element);if(!tokens){tokens={};versions.set(element,tokens);}const token=Symbol();tokens[name]=token;
  nativeSet.call(element,'data-wb-'+name,value);
  (name==='srcset'?rewriteList(value):dataURI(target)).then(data=>{if(tokens[name]===token){nativeSet.call(element,name,data);element.removeAttribute('data-wb-'+name);}}).catch(fail);return true;
 };
 Element.prototype.setAttribute=function(name,value){if(resourceAttribute(this,name.toLowerCase())&&assign(this,name.toLowerCase(),String(value)))return;return nativeSet.call(this,name,value);};
 for(const [type,names]of [[HTMLImageElement,['src','srcset']],[HTMLScriptElement,['src']],[HTMLLinkElement,['href']],[HTMLMediaElement,['src']],[HTMLSourceElement,['src','srcset']],[HTMLVideoElement,['poster']],[HTMLInputElement,['src']],[HTMLEmbedElement,['src']],[HTMLObjectElement,['data']]])for(const name of names){const descriptor=Object.getOwnPropertyDescriptor(type.prototype,name);if(!descriptor?.set)continue;Object.defineProperty(type.prototype,name,{...descriptor,set(value){if(!assign(this,name,String(value)))descriptor.set.call(this,value);}});}
 const cssCache=new Map();
 const externalCSS=value=>/(?:url\(|@import\s+)[^;]*(?:https?:|\/\/)/i.test(value);
 const css=async value=>{let next=value;for(const match of [...value.matchAll(/@import\s+(['"])((?:https?:)?\/\/[^'"]+)\1/gi)])next=next.replace(match[0],'@import url("'+await dataURI(remote(match[2]))+'")');const matches=[...next.matchAll(/url\(\s*(['"]?)(https?:\/\/[^)'"\s]+|\/\/[^)'"\s]+)\1\s*\)/gi)];for(const match of matches)next=next.replace(match[0],'url("'+await dataURI(remote(match[2]))+'")');return next;};
 const nativeRule=CSSStyleSheet.prototype.insertRule,nativeReplace=CSSStyleSheet.prototype.replace,nativeReplaceSync=CSSStyleSheet.prototype.replaceSync;
 CSSStyleSheet.prototype.insertRule=function(rule,index=0){if(!externalCSS(rule))return nativeRule.call(this,rule,index);css(rule).then(value=>nativeRule.call(this,value,Math.min(index,this.cssRules.length))).catch(fail);return index;};
 if(nativeReplace)CSSStyleSheet.prototype.replace=function(text){return css(text).then(value=>nativeReplace.call(this,value));};
 if(nativeReplaceSync)CSSStyleSheet.prototype.replaceSync=function(text){if(!externalCSS(text))return nativeReplaceSync.call(this,text);css(text).then(value=>nativeReplaceSync.call(this,value)).catch(fail);};
 const scan=element=>{
  if(!(element instanceof Element))return;
  for(const name of ['src','srcset','href','poster','data']){const value=element.getAttribute('data-wb-'+name)||element.getAttribute(name);if(value&&resourceAttribute(element,name))assign(element,name,value);}
  const style=element.getAttribute('style');if(style&&externalCSS(style)&&cssCache.get(element)!==style){cssCache.set(element,style);css(style).then(value=>nativeSet.call(element,'style',value)).catch(fail);}
  if(element.tagName==='STYLE'&&externalCSS(element.textContent)&&cssCache.get(element)!==element.textContent){const text=element.textContent;cssCache.set(element,text);css(text).then(value=>element.textContent=value).catch(fail);}
 };
 const observe=root=>new MutationObserver(records=>{for(const record of records){scan(record.target);if(record.type!=='attributes')for(const node of record.addedNodes){scan(node);if(node.querySelectorAll)node.querySelectorAll('*').forEach(scan);}}}).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['src','srcset','href','poster','data','style']});
 observe(document.documentElement);
 const attach=Element.prototype.attachShadow;
 Element.prototype.attachShadow=function(options){const root=attach.call(this,options);observe(root);lockInteractions(root);return root;};
 document.querySelectorAll('*').forEach(scan);
})();</script>`;
