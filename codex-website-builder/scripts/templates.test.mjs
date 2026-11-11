import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const sandbox = await mkdtemp(join(tmpdir(), 'website-template-'));
const env = { ...process.env, WEBSITE_BUILDER_PREVIEW_VENDOR_FIXTURES:'1', WEBSITE_BUILDER_PROJECT_ROOT: join(sandbox, 'project'), WEBSITE_BUILDER_SKILL_ROOT: resolve('skills/website-builder'), WEBSITE_BUILDER_ROOT: sandbox };
const client = new Client({ name: 'template-test', version: '1' });
const transport = new StdioClientTransport({ command: process.execPath, args: [resolve('dist/server/index.js')], env });
const call = async (name, input) => {
  const result = await client.callTool({ name, arguments: input });
  assert.ok(!result.isError, JSON.stringify(result));
  return JSON.parse(result.content[0].text);
};
let preview, browser;
try {
  await client.connect(transport);
  const state = await call('website_project', { thread_id: 'template-test', name: 'Template fidelity', pages: [{ path: 'index.html', title: 'Home' }] });
  const ids = { thread_id: state.thread_id, project_id: state.project_id };
  const initial = await call('website_templates', { mode: 'audit', ...ids });
  assert.equal(initial.advisory, true);
  assert.ok(!('passed' in initial), 'no generation success score is calculated');
  const bound = await call('website_templates', { mode: 'code', ...ids, targets: [{ file: 'index.html', region: 'home-hero', id: 'carousel-14', baseline: 'html' }] });
  const template = bound.templates[0], binding = bound.binding.bindings[0];
  const heroScript = template.js;
  assert.ok(!heroScript.includes('initializeResources'), 'use user-cleaned template source directly');
  assert.ok(template.overview.includes('Responsiveness'));
  assert.ok(template.html && template.js && template.requiredParts.includes('JavaScript'));
  const marked = source => `${binding.start}\n${source}\n${binding.end}`;
  const writePage = source => call('website_write', { ...ids, files: [{ path: 'index.html', fragment: true, content: `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap"><main>${source}</main><script src="js/hero.js"></script>` }] });
  await call('website_write', { ...ids, files: [
    { path: 'js/app.js', content: 'window.tailwind.config={theme:{extend:{fontFamily:{sans:["Nunito","sans-serif"]},colors:{primary:"#123456",accent:"#f5f5f5",surface:"#fff",content:"#222"}}}};document.addEventListener("DOMContentLoaded",()=>{const resize=()=>{document.documentElement.style.fontSize=innerWidth<768?"12px":"";};$(window).off("resize.templateTest").on("resize.templateTest",resize);resize();});' },
    { path: 'js/data.js', content: 'window.productData=[];' },
    { path: 'js/hero.js', content: heroScript },
    ...['header', 'footer', 'cart', 'card'].map(name => ({ path: `components/${name}.js`, content: `customElements.define('${name}-component',class extends HTMLElement{});` })),
  ] });
  let result = await writePage(marked(template.html));
  assert.equal(result.pages[0].status, 'ready');
  const output = await readFile(join(state.directory, 'index.html'), 'utf8');
  assert.ok(!output.includes('<style>'), 'default shell remains utility-based');
  const variants = [
    marked('<section><h1>Different structure</h1></section>'),
    marked(template.html.replaceAll('lg:hidden', '').replaceAll('lg:block', '')),
    marked(template.html.replace(/class="[^"]*"/g, 'class="custom"')),
    '<main><section style="display:grid"><h1>No template markers</h1></section></main>',
    marked(template.html) + '<section><div><button>New content</button></div></section>'.repeat(100)
  ];
  for (const variant of variants) {
    result = await writePage(variant);
    assert.equal(result.pages[0].status, 'ready', 'fidelity, style and provenance do not gate page readiness');
    const advisory = await call('website_templates', { mode: 'audit', ...ids });
    assert.equal(advisory.advisory, true);
    assert.ok(!('passed' in advisory) && !('regions' in advisory), 'no fidelity score exists');
  }
  // Existing contracts, even obsolete thresholds/invalid template IDs, cannot block finish.
  await writeFile(join(state.metadata_directory, 'website-builder.templates.json'), JSON.stringify({ threshold: 100, bindings: [{ file: 'missing.js', id: 'missing-template', region: 'old' }] }));
  result = await call('website_project', { action: 'finish', ...ids, paths: ['index.html'] });
  assert.equal(result.pages[0].status, 'ready');
  result = await writePage('<link rel="stylesheet" href="css/missing.css"><h1>Missing dependency</h1>');
  assert.equal(result.pages[0].status, 'error', 'missing local dependencies still block readiness');
  result = await call('website_write', { ...ids, files: [{ path: 'index.html', content: '<html><body>partial' }] });
  assert.equal(result.pages[0].status, 'error', 'partial HTML is still unfinished');
  result = await writePage(marked(template.html));
  assert.equal(result.pages[0].status, 'ready');

  const shared = await Promise.all(['js/app.js', 'js/data.js', 'components/header.js', 'components/footer.js', 'components/card.js'].map(async path => ({ path, content: await readFile(join(state.directory, path), 'utf8') })));
  const cartSource = { path: 'components/cart.js', content: 'customElements.define("cart-component",class extends HTMLElement{});' };
  for (const mode of ['page', 'drawer', 'none']) {
    const pages = [{ path: 'index.html', title: 'Home' }, ...(mode === 'page' ? [{ path: 'cart.html', title: 'Cart' }] : [])];
    const cartState = await call('website_project', { thread_id: 'cart-' + mode, pages });
    const cartIds = { thread_id: cartState.thread_id, project_id: cartState.project_id };
    const files = [...shared, ...(mode === 'none' ? [] : [cartSource]), ...pages.map(page => ({ path: page.path, fragment: true, content: page.path === 'cart.html' ? '<main><cart-component view-mode="inline"></cart-component></main>' : '<main><h1>Home</h1></main>' }))];
    const completed = await call('website_write', { ...cartIds, files });
    assert.ok(completed.pages.every(page => page.status === 'ready'));
    assert.equal(completed.pages.length, mode === 'page' ? 2 : 1, 'drawer is not a separate canvas page');
    const home = await readFile(join(cartState.directory, 'index.html'), 'utf8');
    assert.equal((home.match(/<cart-component\b/g) || []).length, mode === 'drawer' ? 1 : 0);
    assert.equal(home.includes('components/cart.js'), mode !== 'none');
    execFileSync(process.execPath, ['skills/website-builder/scripts/hook-page.mjs', `--cart=${mode}`, '--content=<main>Legacy hook</main>', `--output=${join(cartState.directory, 'legacy.html')}`]);
    const legacy = await readFile(join(cartState.directory, 'legacy.html'), 'utf8');
    assert.equal((legacy.match(/<cart-component\b/g) || []).length, mode === 'drawer' ? 1 : 0);
    assert.equal(legacy.includes('components/cart.js'), mode !== 'none');
    if (mode === 'page') {
      const cart = await readFile(join(cartState.directory, 'cart.html'), 'utf8');
      assert.equal((cart.match(/<cart-component\b/g) || []).length, 1, 'page cart is mounted once');
      assert.ok(cart.includes('view-mode="inline"'));
    }
    if (mode === 'drawer') {
      assert.ok(home.includes('view-mode="drawer"'));
      await call('website_write', { ...cartIds, files: [{ path: 'index.html', fragment: true, content: '<main><cart-component view-mode="drawer"></cart-component></main>' }] });
      const explicit = await readFile(join(cartState.directory, 'index.html'), 'utf8');
      assert.equal((explicit.match(/<cart-component\b/g) || []).length, 1, 'explicit drawer is not duplicated');
    }
  }
  await call('website_project', { thread_id: state.thread_id, project_id: state.project_id });
  preview = spawn(process.execPath, ['dist/server/index.js', '--preview'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  const url = await new Promise((done, reject) => { preview.stdout.once('data', data => done(data.toString().trim())); preview.once('error', reject); });
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage(); const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('iframe').waitFor();
  const frame = await (await page.locator('iframe').elementHandle()).contentFrame();
  await frame.waitForFunction(() => !!document.querySelector('.mobile-banner-swiper-14')?.swiper);
  await page.getByRole('button', { name: '页面宽度', exact: true }).click();
  const viewports = [];
  for (const width of [375, 768, 1280]) {
    await page.getByLabel('统一宽度').selectOption(String(width));
    await frame.waitForFunction(({ width, font }) => innerWidth === width && getComputedStyle(document.documentElement).fontSize === font, { width, font: width < 768 ? '12px' : '16px' });
    const measured = await frame.evaluate(() => ({ width: innerWidth, font: getComputedStyle(document.documentElement).fontSize, desktop: getComputedStyle(document.querySelector('.banner-swiper-14').closest('section')).display, mobile: getComputedStyle(document.querySelector('.mobile-banner-swiper-14').closest('section')).display, swiper: !!document.querySelector('.mobile-banner-swiper-14').swiper }));
    assert.equal(measured.desktop === 'none', width < 1024);
    assert.equal(measured.mobile === 'none', width >= 1024);
    assert.ok(measured.swiper);
    viewports.push(measured);
  }
  assert.deepEqual(errors, []);
  const report = { result: 'PASS', checks: ['full template source and optional provenance', 'no fidelity score or readiness gate, including old contracts', 'changed DOM/classes/coverage/inline CSS remain ready', 'missing dependencies and incomplete HTML still error', 'cart page/inline or shared drawer without duplicates', 'no missing cart script injection', 'real template responsive rendering and Swiper at 375/768/1280px'], viewports };
  await mkdir('artifacts', { recursive: true });
  await writeFile('artifacts/template-verification.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await client.close(); if (browser) await browser.close(); if (preview) preview.kill(); }
