import assert from 'node:assert/strict';
import { readFile, mkdtemp, stat, readdir, writeFile, unlink, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { chromium } from '@playwright/test';

const root=await mkdtemp(join(tmpdir(),'website-features-'));
const env={...process.env, WEBSITE_BUILDER_PREVIEW_VENDOR_FIXTURES:'1',WEBSITE_BUILDER_ROOT:root,WEBSITE_BUILDER_PROJECT_ROOT:join(root,'project'),WEBSITE_BUILDER_SKILL_ROOT:resolve('skills/website-builder')};
const client=new Client({name:'features-test',version:'1'});
let browser;
const call=async(name,args)=>{const value=await client.callTool({name,arguments:args});assert.ok(!value.isError,JSON.stringify(value));return value;};
const json=async(name,args)=>JSON.parse((await call(name,args)).content[0].text);
try {
  await client.connect(new StdioClientTransport({command:process.execPath,args:[resolve('dist/server/index.js')],env}));
  const layouts=JSON.parse(await readFile('skills/website-builder/references/shop-layouts.json','utf8'));
  for(const [id,layout] of Object.entries(layouts)) {
    const [code]=await json('website_templates',{mode:'code',ids:[id]});
    assert.deepEqual(JSON.parse(code.layoutContract),layout);
    const regions=[...code.html.matchAll(/data-region="([^"]+)"/g)].map(match=>match[1]);
    assert.deepEqual(regions,layout.regions);
    const grid=code.html.match(/<div[^>]+data-region="products-grid"[^>]*>/)[0];
    assert.ok(grid.includes(layout.columns));
    assert.ok(!code.overview.includes('optional 260px'));
  }
  // Real account/cart/wishlist/order methods, plus visible login redirect guard.
  const values=new Map(),alerts=[],redirects=[];
  const window={crypto:webcrypto,commerceConfig:{storageKey:'feature-test',loginRequiredMessage:'请先登录'},localStorage:{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},location:{pathname:'/shop.html',search:'?category=trail',assign:url=>redirects.push(url)},Toast:{info:message=>alerts.push(message)}};
  vm.runInNewContext(await readFile('skills/website-builder/assets/commerce/ec-sdk.js','utf8'),{window,TextEncoder,Intl,crypto:webcrypto});
  const {APP}=window;
  APP.cart.add({id:'B012345678',name:'Demo',price:42},1);
  APP.wishlist.add('B012345678');
  assert.equal(APP.cart.count(),0); assert.equal(APP.wishlist.count(),0);
  assert.equal(alerts[0],'请先登录');
  assert.equal(redirects[0],'login.html?returnTo=shop.html%3Fcategory%3Dtrail');
  for(const value of ['https://evil.test','//evil.test','../admin.html','%2f%2fevil.test','foo\\bar.html','a/../index.html'])assert.equal(APP.auth.safeReturnTo(value),'shop.html');
  assert.equal(APP.auth.safeReturnTo('product.html?id=B012345678'),'product.html?id=B012345678');
  assert.ok((await APP.account.register({username:'Test',email:'test@example.com',password:'test-password-42'})).success);
  if(!APP.account.logged())assert.ok((await APP.account.login('test@example.com','test-password-42')).success);
  assert.ok(APP.auth.requireLogin());
  APP.cart.add({id:'B012345678',name:'Demo',price:42},2); APP.wishlist.add('B012345678');
  assert.equal(APP.cart.count(),2); assert.equal(APP.wishlist.count(),1);
  assert.ok(APP.order.create({name:'Demo',address:'Demo address'}).success); assert.equal(APP.cart.count(),0);
  APP.account.logout(); APP.wishlist.add('B012345678');
  assert.equal(redirects.length,2,'logout resets the prompt guard');

  const pages=Array.from({length:8},(_,i)=>({path:i?'page-'+i+'.html':'index.html',title:'Page '+i}));
  const project=await json('website_project',{thread_id:'features',name:'Features',pages});
  const ids={thread_id:project.thread_id,project_id:project.project_id};
  assert.ok(project.metadata_directory && !project.metadata_directory.startsWith(project.directory));
  assert.deepEqual(await readdir(project.directory),[],'new production folder has no management manifest');
  await json('website_write',{...ids,files:[{path:'website-builder.design.json',content:'{"purpose":"design"}'}]});
  assert.equal(JSON.parse(await readFile(join(project.metadata_directory,'website-builder.design.json'),'utf8')).purpose,'design');
  await assert.rejects(readFile(join(project.directory,'website-builder.design.json')));
  for(const path of ['temp/script.js','artifacts/report.json','notes.tmp','data/backup.bak']) {
    assert.ok((await client.callTool({name:'website_write',arguments:{...ids,files:[{path,content:'{}'}]}})).isError,'process artifacts cannot enter production');
  }
  // Async render completion and lazy image below fold: screenshot must contain both.
  const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
  await json('website_write',{...ids,files:pages.map(page=>({path:page.path,content:`<!doctype html><html><head><meta charset="utf-8"><title>${page.title}</title></head><body><h1>${page.title}</h1><div style="height:2200px"></div><img loading="lazy" width="80" height="80" src="${image}"><script>window.websiteReady=new Promise(resolve=>setTimeout(()=>{const footer=document.createElement('footer');footer.style.height='420px';footer.textContent='ASYNC COMPLETE';document.body.append(footer);resolve();},600));</script></body></html>`}))});
  const screenshot=await call('website_screenshot',{...ids,path:'index.html',width:375});
  const result=JSON.parse(screenshot.content[0].text), bytes=await readFile(result.path);
  assert.ok(result.path.startsWith(project.metadata_directory),'screenshot stays outside production');
  assert.deepEqual((await readdir(project.directory)).sort(),[...pages.map(page=>page.path),'components'].sort(),'production contains only runtime pages and the shared Toast component');
  assert.equal(screenshot.content[1].type,'image');
  assert.equal(bytes.readUInt32BE(16),375);
  assert.ok(bytes.readUInt32BE(20)>2700,'full page includes async footer below fold');
  assert.ok((await stat(result.path)).size>1000);
  assert.ok((await client.callTool({name:'website_screenshot',arguments:{...ids,project_id:'wrong',path:'index.html'}})).isError);
  await json('website_write',{...ids,files:[{path:'page-7.html',content:'<!doctype html><html><head><title>Broken</title></head><body><img src="assets/missing.png"></body></html>'}]});
  const broken=await client.callTool({name:'website_screenshot',arguments:{...ids,path:'page-7.html'}});
  assert.ok(broken.isError,'broken image must reject screenshot');
  await json('website_write',{...ids,files:[{path:'page-7.html',content:'<!doctype html><html><head><title>Good</title></head><body>Last page</body></html>'}]});
  const resource=await client.readResource({uri:'ui://codex-website-builder/canvas'});
  const bootstrap=JSON.parse(resource.contents[0].text.match(/window\.__WEBSITE_BUILDER__=(.*?);<\/script>/)[1]);
  browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1500,height:1000}});
  await page.goto(bootstrap.origin+new URL(bootstrap.api).pathname.replace('/api/site','/canvas'));
  await page.locator('.page-panel').nth(7).waitFor();
  await page.waitForFunction(()=>document.querySelector('.canvas-world').dataset.columns==='5');
  const positions=await page.locator('.page-panel').evaluateAll(nodes=>nodes.map(node=>({x:node.offsetLeft,y:node.offsetTop})));
  assert.equal(positions[0].y,positions[4].y); assert.ok(positions[5].y>positions[0].y);
  await page.getByRole('button',{name:'页面宽度',exact:true}).click();
  for(const width of ['768','375']) {
    await page.getByLabel('统一宽度').selectOption(width);
    await page.waitForFunction(()=>document.querySelector('.canvas-world').dataset.columns==='7');
    const positions=await page.locator('.page-panel').evaluateAll(nodes=>nodes.map(node=>node.offsetTop));
    assert.equal(positions[0],positions[6]); assert.ok(positions[7]>positions[0]);
  }
  // Render each actual Shop source with the legacy card tag mapped to the current name.
  const shopPage=await browser.newPage();
  const tailwind=await readFile('assets/vendor/tailwind.js','utf8');
  const jquery=await readFile('assets/vendor/jquery.js','utf8');
  for(const id of Object.keys(layouts)) {
    const [code]=await json('website_templates',{mode:'code',ids:[id]});
    await shopPage.setContent(`<html><head></head><body>${code.html}</body></html>`);
    await shopPage.addScriptTag({content:tailwind});
    await shopPage.addScriptTag({content:jquery});
    await shopPage.addScriptTag({content:`customElements.define('card-component',class extends HTMLElement{connectedCallback(){this.style.display='block';this.style.height='200px';this.textContent='Product';}});`});
    await shopPage.addScriptTag({content:code.js.replaceAll('card-01','card-component')});
    await shopPage.locator('card-component').first().waitFor();
    for(const width of [375,768,1280]) {
      await shopPage.setViewportSize({width,height:900});
      const expected=width<640?2:width>=1024&&['shop-01','shop-04'].includes(id)?4:3;
      await shopPage.waitForFunction(expected=>getComputedStyle(document.querySelector('[data-region="products-grid"]')).gridTemplateColumns.split(' ').length===expected,expected);
      const sidebar=shopPage.locator('aside[data-region="sidebar"]');
      if(id==='shop-01')assert.equal(await sidebar.count(),0);
      else assert.equal(await sidebar.isVisible(),width>=1024);
    }
    await shopPage.setViewportSize({width:375,height:900});
    if(id==='shop-02') {
      await shopPage.locator('#mobile-filters-toggle').click();
      assert.ok(await shopPage.locator('#filters-sidebar').isVisible());
    } else if(id==='shop-04') {
      await shopPage.locator('#mobile-filter-btn').click();
      assert.ok(await shopPage.locator('#mobile-filter-drawer').isVisible());
    } else if(id==='shop-12') {
      await shopPage.locator('#mobileFilterBtn').click();
      assert.ok(await shopPage.locator('#mobileFilterDrawer').isVisible());
      await shopPage.locator('#mobileFilterClose').click();
      await shopPage.locator('#listView').click();
      assert.equal(await shopPage.locator('[data-region="products-grid"]').evaluate(el=>getComputedStyle(el).display),'flex');
    }
  }
  // An old project is still readable; subsequent state/binding writes go outside production.
  const legacy=await json('website_project',{thread_id:'legacy-layout',name:'Legacy',pages:[{path:'index.html',title:'Legacy'}]});
  const legacyIds={thread_id:legacy.thread_id,project_id:legacy.project_id};
  const oldManifest=await readFile(join(legacy.metadata_directory,'project.json'),'utf8');
  await writeFile(join(legacy.directory,'.website-builder.json'),oldManifest);
  await unlink(join(legacy.metadata_directory,'project.json'));
  await writeFile(join(legacy.directory,'website-builder.templates.json'),JSON.stringify({bindings:[{file:'index.html',region:'catalog',id:'shop-01'}]}));
  const reused=await json('website_project',{action:'open',...legacyIds});
  assert.equal(reused.project_id,legacy.project_id);
  const audit=await json('website_templates',{mode:'audit',...legacyIds});
  assert.equal(audit.bindings[0].id,'shop-01');
  await json('website_templates',{mode:'bind',...legacyIds,targets:[{file:'index.html',region:'catalog',id:'shop-02'}]});
  assert.equal(JSON.parse(await readFile(join(legacy.metadata_directory,'website-builder.templates.json'),'utf8')).bindings[0].id,'shop-02');
  assert.equal(await readFile(join(legacy.directory,'.website-builder.json'),'utf8'),oldManifest,'legacy source is not modified');
  assert.equal(JSON.parse(await readFile(join(legacy.directory,'website-builder.templates.json'),'utf8')).bindings[0].id,'shop-01');
  const selected=await json('website_templates',{mode:'select'});
  const shopCandidates=selected.find(item=>item.category==='shop').candidates;
  assert.ok(shopCandidates.find(item=>item.id==='shop-02').usage.projects>=1);
  const aboutCandidates=selected.find(item=>item.category==='about').candidates;
  assert.equal(new Set(aboutCandidates.map(item=>item.summary)).size,aboutCandidates.length);
  for(const candidate of aboutCandidates) {
    const [code]=await json('website_templates',{mode:'code',ids:[candidate.id]});
    const layout=JSON.parse(code.layoutContract);
    assert.deepEqual([...code.html.matchAll(/data-region="([^"]+)"/g)].map(match=>match[1]),layout.regions);
    assert.ok(!code.overview.includes('key metrics dashboard'));
  }
  const report={result:'PASS',checks:['distinct About layouts and recorded template usage exposed to selection','production directory excludes control manifests, drafts and screenshots','metadata writes route outside production; temporary/report writes rejected','legacy project metadata read without deleting or rewriting old files','four Shop layout contracts match actual HTML','four Shop sources render 2/3/4 columns at 375/768/1280; mobile filters and grid/list switch','guest prompt + login redirect; rejected writes','safe login return paths and logout reset','registered account cart/wishlist and order creation','full PNG includes decoded lazy image and async footer','broken image and wrong project rejected','PC 5, tablet/mobile 7 columns'],screenshot:result.path};
  await mkdir('artifacts',{recursive:true});await writeFile('artifacts/features-verification.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
} finally {if(browser)await browser.close();await client.close();}
