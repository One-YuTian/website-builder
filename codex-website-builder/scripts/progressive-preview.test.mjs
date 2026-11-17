import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { chromium } from '@playwright/test';

const root = await mkdtemp(join(tmpdir(), 'progressive-preview-'));
const client = new Client({ name: 'progressive-preview-test', version: '1' });
const call = async (name, args) => {
  const result = await client.callTool({ name, arguments: args });
  assert.ok(!result.isError, JSON.stringify(result));return result;
};
const json = async (name, args) => JSON.parse((await call(name, args)).content[0].text);
let browser;
try {
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [resolve('dist/server/index.js')], env: { ...process.env, WEBSITE_BUILDER_PROJECT_ROOT: join(root, 'project'), WEBSITE_BUILDER_ROOT: root, WEBSITE_BUILDER_SKILL_ROOT: resolve('skills/website-builder') } }));
  const paths = ['wishlist.html', 'checkout.html', 'index.html', 'login.html', 'orders.html'];
  const state = await json('website_project', { thread_id: 'progressive', pages: paths.map(path => ({ path, title: path })) });
  const ids = { thread_id: state.thread_id, project_id: state.project_id };
  const html = '<!doctype html><html><head><script src="js/sdk.js"></script><script src="js/data.js"></script><script src="js/app.js"></script></head><body><div id="content">SDK preview</div></body></html>';
  await json('website_write', { ...ids, files: [
    { path: 'js/sdk.js', content: await readFile('skills/website-builder/assets/commerce/sdk.js', 'utf8') },
    { path: 'js/data.js', content: 'window.productData=[{id:"B000000001",name:"Actual catalog item",final_price:25,main_image:"",category:"Home"}];' },
    { path: 'js/app.js', content: 'SDK.init(window.productData,{});' },
    ...paths.map(path => ({ path, content: html })),
  ] });
  const initial = (await call('project_sync', { ...ids, metadata_only: true, wait_ms: 0 }))._meta.sync;
  assert.equal(initial.manifest.pages.length, 5);
  assert.deepEqual(initial.pages, {});
  const first = (await call('project_sync', { ...ids, since: initial.revision, page_limit: 1, wait_ms: 0 }))._meta.sync;
  assert.deepEqual(Object.keys(first.pages), ['index.html']);
  const second = (await call('project_sync', { ...ids, since: first.revision, known: { 'index.html': first.manifest.pages.find(p => p.path === 'index.html').version }, page_limit: 1, priority_path: 'checkout.html', wait_ms: 0 }))._meta.sync;
  assert.deepEqual(Object.keys(second.pages), ['checkout.html']);
  const bulk = (await call('project_sync', { ...ids, wait_ms: 0 }))._meta.sync;
  assert.equal(Object.keys(bulk.pages).length, 5, 'legacy bulk calls remain compatible');
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const render = async (path, storage = {}) => {
    const page = await browser.newPage();
    const errors = [];page.on('pageerror', e => errors.push(e.message));
    const source = gunzipSync(Buffer.from(bulk.pages[path], 'base64')).toString();
    const snapshot = source.replaceAll('"__WEBSITE_BUILDER_VIRTUAL_URL__"', JSON.stringify(`https://website-builder.invalid/${path}`)).replaceAll('"__WEBSITE_BUILDER_STORAGE__"', JSON.stringify(storage)).replaceAll('__WEBSITE_BUILDER_BASE_URL__', `https://website-builder.invalid/${path}`);
    await page.setContent(snapshot);
    await page.waitForFunction(() => window.SDK && window.APP);
    assert.deepEqual(errors, []);
    return page;
  };
  for (const path of ['checkout.html', 'wishlist.html']) {
    const page = await render(path);
    const value = await page.evaluate(() => ({ logged: APP.account.logged(), cart: APP.cart.list(), wish: APP.wishlist.list(), ready: window.__websiteBuilderMockReady }));
    assert.ok(value.logged && value.ready);
    assert.equal(value.cart[0].productid, 'B000000001');
    assert.ok(value.wish.length);
    await page.close();
  }
  const orderPage = await render('orders.html');
  assert.equal(await orderPage.evaluate(() => APP.order.list().length), 1);
  await orderPage.close();
  const guest = await render('login.html');
  assert.equal(await guest.evaluate(() => APP.account.logged()), false);
  await guest.close();
  const existing = { 'user': JSON.stringify({ id: 'existing', email: 'existing@example.invalid' }), 'cart:existing': '[]', 'wishlist:existing': '[]' };
  const retained = await render('checkout.html', existing);
  assert.equal(await retained.evaluate(() => APP.account.current().id), 'existing');
  assert.equal(await retained.evaluate(() => APP.cart.list().length + APP.wishlist.list().length), 0);
  assert.equal(await readFile(join(state.directory, 'index.html'), 'utf8').then(s => s.includes('__websiteBuilderMockFrame')), false);
  const direct=await json('website_project',{thread_id:'direct-files',new_project:true,pages:[{path:'index.html',title:'Home'}]});
  await json('website_project',{thread_id:'other-project',new_project:true});
  await writeFile(join(direct.directory,'index.html'),'<!doctype html><html><body>Direct queued output</body></html>');
  const directSync=(await call('project_sync',{project_id:direct.project_id,wait_ms:0}))._meta.sync;
  assert.equal(directSync.manifest.threadId,'','a pinned readonly project must not inherit another project thread');
  assert.equal(directSync.manifest.pages[0].status,'ready','queued direct-file output becomes ready without begin/finish');
  assert.ok(gunzipSync(Buffer.from(directSync.pages['index.html'],'base64')).toString().includes('Direct queued output'));
  await writeFile(join(direct.directory,'index.html'),'<!doctype html><html><body>Updated direct output</body></html>');
  const updated=(await call('project_sync',{project_id:direct.project_id,since:directSync.revision,known:{'index.html':directSync.manifest.pages[0].version},wait_ms:0}))._meta.sync;
  assert.ok(updated.manifest.pages[0].version>directSync.manifest.pages[0].version);
  assert.ok(gunzipSync(Buffer.from(updated.pages['index.html'],'base64')).toString().includes('Updated direct output'));
  console.log('PASS: metadata first, home/selected page priority, single-page sync, bulk compatibility, isolated checkout/wishlist Mock, guest login and existing-state preservation');
} finally { await browser?.close(); await client.close(); }
