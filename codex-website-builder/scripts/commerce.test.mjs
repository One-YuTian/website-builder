import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { spawn } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { chromium } from '@playwright/test';

const sandbox = await mkdtemp(join(tmpdir(), 'website-commerce-'));
const config = JSON.parse(await readFile('mcp.json', 'utf8')).mcpServers['website-builder'];
const env = {
  ...process.env, WEBSITE_BUILDER_PREVIEW_VENDOR_FIXTURES:'1', ...config.env,
  WEBSITE_BUILDER_ROOT:sandbox,
  WEBSITE_BUILDER_PROJECT_ROOT: join(sandbox, 'project'),
  WEBSITE_BUILDER_SKILL_ROOT: resolve('skills/website-builder'),
};
const client = new Client({ name: 'commerce-test', version: '1' });
const transport = new StdioClientTransport({ command: process.execPath, args: [resolve('dist/server/index.js')], env });
const call = async (name, input) => {
  const result = await client.callTool({ name, arguments: input });
  assert.ok(!result.isError, JSON.stringify(result));
  return JSON.parse(result.content[0].text);
};
const image = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>').toString('base64');
const samples = ['Daypacks', 'Bottles', 'Accessories'].map((category, index) => ({
  name: `Trail ${category}`, brand: 'Demo Outdoors', category,
  main_image: image, final_price: 25 + index * 30,
  description: `Demo ${category.toLowerCase()} for day hikes.`,
  features: ['Durable construction', 'Travel-ready design'],
  specifications: [{ key: 'Category', value: category }, { key: 'Brand', value: 'Demo Outdoors' }],
}));
let browser, preview;
try {
  await client.connect(transport);
  const state = await call('website_project', { thread_id: 'commerce-test', name: 'Commerce test', pages: [{ path: 'index.html', title: 'Home' }, { path: 'shop.html', title: 'Shop' }] });
  const prepared = await call('website_commerce', { thread_id: state.thread_id, project_id: state.project_id, products: samples, seed: 'test-catalog' });
  assert.equal(prepared.count, 24);
  assert.ok(prepared.written.includes('js/app.js'));
  await assert.rejects(readFile(join(state.directory, 'js/commerce-config.js')), 'new projects must not create a separate configuration script');
  assert.ok((await readFile(join(state.directory, 'js/app.js'), 'utf8')).includes(prepared.config_defaults.storageKey));
  const source = await readFile(join(state.directory, 'js/data.js'), 'utf8');
  assert.ok(source.split('\n').length > 100);
  const values = new Map();
  const context = vm.createContext({
    window: { crypto: webcrypto, commerceConfig: { storageKey: 'test', currency: 'USD', locale: 'en-US' }, localStorage: { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) } },
    TextEncoder, Intl, crypto: webcrypto,
  });
  for (const path of ['js/data.js', 'js/sdk.js', 'js/ec-sdk.js']) {
    vm.runInContext(await readFile(join(state.directory, path), 'utf8'), context, { timeout: 1000 });
  }
  const { SDK, APP, productData } = context.window;
  SDK.init(productData, context.window.commerceConfig);
  assert.equal(SDK.count(), 24);
  assert.equal(context.window.storeData.getAll().length, 24);
  assert.equal(context.window.storeData.getByCategory('Daypacks').length, 8);
  assert.equal(context.window.storeData.getById(productData[0].id).id, productData[0].id);
  assert.equal(context.window.storeData.toCartItem(productData[0]).price, productData[0].final_price);
  assert.equal(typeof context.window.storeData.formatPrice(25), 'string');
  assert.equal(new Set(productData.map(product => product.id)).size, 24);
  assert.ok(productData.every(product => /^B[A-Z0-9]{9}$/.test(product.id)));
  assert.equal(SDK.search('trail').count(), 24);
  assert.equal(SDK.list().filter({ category: 'Daypacks', priceRange: { min: 20, max: 40 } }).count(), 8);
  assert.ok(SDK.list().sort('final_price', 'desc').limit(2).result()[0].final_price >= 55);
  const p = SDK.get(productData[0].id);
  assert.equal(typeof p.price, 'string');
  assert.equal(typeof p.final_price, 'number');
  assert.equal(SDK.get('missing'), null);
  const secret = 'demo-password-123';
  const a = await APP.account.register({ username: 'A', email: ' A@example.com ', password: secret });
  assert.ok(a.success);
  assert.equal(a.user.email, 'a@example.com');
  assert.equal(a.user.password, undefined);
  assert.ok(!JSON.stringify([...values.values()]).includes(secret));
  assert.equal(APP.account.list()[0].passwordhash, undefined);
  APP.cart.add({ id: p.id, name: p.name, image: p.main_image, price: p.final_price }, 2);
  const row = APP.cart.list()[0];
  assert.notEqual(row.id, p.id);
  APP.cart.update(row.id, 3);
  assert.equal(APP.cart.count(), 3);
  APP.wishlist.toggle(p.id);
  assert.ok(APP.wishlist.has(p.id));
  APP.account.logout();
  let errorCode;
  APP.on('CART_ADD', event => { if (event.success === false) errorCode = event.code; });
  APP.cart.add({ id: p.id }, 1);
  assert.equal(errorCode, 2001);
  assert.ok((await APP.account.register({ username: 'B', email: 'b@example.com', password: secret })).success);
  assert.equal(APP.cart.count(), 0);
  assert.equal(APP.wishlist.count(), 0);
  assert.ok((await APP.account.login('A@EXAMPLE.COM', secret)).success);
  assert.equal(APP.cart.count(), 3);
  assert.equal(APP.wishlist.count(), 1);
  assert.equal((await APP.account.login('a@example.com', 'incorrect')).code, 1002);
  APP.coupon.create({ code: 'SAVE5', amount: 5 });
  assert.ok(APP.coupon.apply('SAVE5').success);
  const order = APP.order.create({ ext: { city: 'Demo City' }, paymentmethod: 'cod' });
  assert.ok(order.success);
  assert.equal(order.order.total, p.final_price * 3 - 5);
  assert.equal(APP.cart.count(), 0);
  productData[0].final_price = 9999;
  assert.equal(APP.order.get(order.order.id).items[0].price, p.final_price);
  assert.ok(APP.order.cancel(order.order.id).success);
  assert.equal((await APP.account.update({ password: 'updated-password' })).success, true);
  APP.account.logout();
  assert.ok((await APP.account.login('a@example.com', 'updated-password')).success);
  const reused = await call('website_commerce', { thread_id: state.thread_id, project_id: state.project_id });
  assert.equal(reused.source, 'existing');
  assert.deepEqual(reused.written, []);
  assert.equal(await readFile(join(state.directory, 'js/data.js'), 'utf8'), source);
  assert.equal((await call('website_commerce', { action: 'validate', thread_id: state.thread_id, project_id: state.project_id })).count, 24);
  const regenerated = await call('website_commerce', { thread_id: state.thread_id, project_id: state.project_id, products: samples, seed: 'test-catalog', regenerate: true });
  assert.equal(regenerated.count, 24);
  assert.equal(await readFile(join(state.directory, 'js/data.js'), 'utf8'), source);
  const api = await call('website_project', { thread_id: 'commerce-api', new_project: true });
  const skipped = await call('website_commerce', { thread_id: api.thread_id, project_id: api.project_id, api_url: 'https://example.invalid/products' });
  assert.equal(skipped.source, 'api');
  await assert.rejects(readFile(join(api.directory, 'js/data.js')));
  const malformed = await call('website_project', { thread_id: 'commerce-protect', new_project: true });
  await mkdir(join(malformed.directory, 'js'));
  const custom = 'window.productData = loadCustomData();';
  await writeFile(join(malformed.directory, 'js/data.js'), custom);
  assert.ok((await client.callTool({ name: 'website_commerce', arguments: { thread_id: malformed.thread_id, project_id: malformed.project_id, products: samples } })).isError);
  assert.equal(await readFile(join(malformed.directory, 'js/data.js'), 'utf8'), custom);
  await call('website_project', { thread_id: state.thread_id, project_id: state.project_id });
  const components = ['header', 'footer', 'cart', 'card'].map(name => ({
    path: `components/${name}.js`,
    content: `customElements.define('${name}-component',class extends HTMLElement{connectedCallback(){this.refresh();window.addEventListener('storage',()=>this.refresh());APP.on('CART_ADD',()=>this.refresh());}refresh(){this.textContent='products:'+SDK.count()+' cart:'+APP.cart.count();}});`,
  }));
  await call('website_write', { thread_id: state.thread_id, project_id: state.project_id, files: [
    { path: 'js/app.js', content: `window.commerceConfig=${JSON.stringify(prepared.config_defaults)};window.app={init(){return true;}};` }, ...components,
    { path: 'css/theme.css', content: 'body{color:#123;background:#fff}h1{font-size:2rem}' },
    ...['index', 'shop'].map(name => ({ path: `${name}.html`, fragment: true, content: `<main><h1>${name}</h1><button type="button">Action</button></main>` })),
  ] });
  const html = await readFile(join(state.directory, 'index.html'), 'utf8');
  assert.ok(html.indexOf('js/sdk.js') < html.indexOf('js/data.js'));
  assert.ok(html.indexOf('window.SDK.init') < html.indexOf('components/header.js'));
  assert.ok(!html.includes('js/commerce-config.js'));
  const formattedApp=await readFile(join(state.directory,'js/app.js'),'utf8');
  assert.ok(formattedApp.includes('window.commerceConfig = ') && formattedApp.includes('\n  init() {'),'local Prettier formats JS');
  assert.equal(await readFile(join(state.directory,'css/theme.css'),'utf8'),'body {\n  color: #123;\n  background: #fff;\n}\nh1 {\n  font-size: 2rem;\n}\n');
  const cli = spawn(process.execPath, ['skills/website-builder/scripts/project.mjs'], {
    env: { ...env, CODEX_THREAD_ID: state.thread_id }, stdio: ['pipe', 'pipe', 'pipe'],
  });
  let cliOutput = '', cliError = '';
  cli.stdout.on('data', chunk => cliOutput += chunk);
  cli.stderr.on('data', chunk => cliError += chunk);
  cli.stdin.end(JSON.stringify({ action: 'commerce', mode: 'validate', project_id: state.project_id }));
  assert.equal(await new Promise(done => cli.on('exit', done)), 0, cliError);
  assert.equal(JSON.parse(cliOutput).count, 24);
  const previous = await readFile(join(state.directory, 'js/app.js'), 'utf8');
  assert.ok((await client.callTool({ name: 'website_write', arguments: { thread_id: state.thread_id, project_id: state.project_id, files: [{ path: 'js/app.js', content: 'function {' }] } })).isError);
  assert.equal(await readFile(join(state.directory, 'js/app.js'), 'utf8'), previous);
  preview = spawn(process.execPath, ['dist/server/index.js', '--preview'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  const url = await new Promise((done, reject) => { preview.stdout.once('data', data => done(data.toString().trim())); preview.once('error', reject); });
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage(); const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.frameLocator('iframe[title="index.html"]').locator('header-component').filter({ hasText: 'products:24 cart:0' }).waitFor();
  const index = await (await page.locator('iframe[title="index.html"]').elementHandle()).contentFrame();
  const shop = page.frameLocator('iframe[title="shop.html"]');
  const shopSrc = await page.locator('iframe[title="shop.html"]').getAttribute('src');
  await index.evaluate(async () => {
    const user = await APP.account.register({ email: 'preview@example.com', password: 'demo-password-123' });
    if (!user.success) throw new Error('Demo account failed in sandbox');
    const p = SDK.list().result()[0];
    APP.cart.add({ id: p.id, name: p.name, image: p.main_image, price: p.final_price }, 2);
  });
  await shop.locator('header-component').filter({ hasText: 'products:24 cart:2' }).waitFor();
  assert.equal(await page.locator('iframe[title="shop.html"]').getAttribute('src'), shopSrc);
  assert.deepEqual(errors, []);
  const report = { result: 'PASS', checks: ['mock schema, stable IDs, filters and numeric price mapping', 'existing data/SDK/config preservation', 'API skips mock and computed data is never overwritten', 'async demo accounts without plaintext passwords', 'account-specific cart/wishlist isolation', 'coupon, order snapshot and cancellation', 'local Prettier formatting and syntax errors preserve old files', 'new commerce configuration in app.js only', 'SDK init before component registration', 'cross-iframe business state refresh without iframe reload'], testRoot: sandbox };
  await mkdir('artifacts', { recursive: true });
  await writeFile('artifacts/commerce-verification.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await client.close();
  if (browser) await browser.close();
  if (preview) preview.kill();
}
