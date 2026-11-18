import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { gunzipSync } from 'node:zlib';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { chromium } from '@playwright/test';

const root = await mkdtemp(join(tmpdir(), 'website-late-assets-'));
const env = { ...process.env, WEBSITE_BUILDER_ROOT: root, WEBSITE_BUILDER_PROJECT_ROOT: join(root, 'project'), WEBSITE_BUILDER_SKILL_ROOT: resolve('skills/website-builder') };
const client = new Client({ name: 'late-assets-test', version: '1' });
let browser, preview;
const call = async (name, args) => {
  const value = await client.callTool({ name, arguments: args });
  assert.ok(!value.isError, JSON.stringify(value)); return value;
};
const shell = body => `<!doctype html><html><head><title>Late images</title></head><body>${body}</body></html>`;
try {
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [resolve('dist/server/index.js')], env }));
  const project = JSON.parse((await call('website_project', { thread_id: 'late-assets', pages: [{ path: 'index.html', title: 'Home' }, { path: 'about.html', title: 'About' }, { path: 'nested/page.html', title: 'Nested' }] })).content[0].text);
  await call('website_write', { thread_id: project.thread_id, project_id: project.project_id, files: [
    { path: 'index.html', content: shell('<img id="hero" src="assets/生成%20图片.png?variant=hero"><script src="components/banner.js"></script>') },
    { path: 'components/banner.js', content: "const image = new Image(); image.id='dynamic'; image.src='assets/生成%20图片.png'; document.body.append(image);" },
    { path: 'nested/page.html', content: shell('<img id="nested" src="/assets/生成%20图片.png">') },
    { path: 'about.html', content: shell('<h1>Unrelated</h1>') },
  ] });
  const original = await readFile(join(project.directory, 'index.html'), 'utf8');
  const before = (await call('project_sync', { thread_id: project.thread_id, wait_ms: 0 }))._meta.sync;
  const known = Object.fromEntries(before.manifest.pages.map(page => [page.path, page.version]));
  assert.ok(gunzipSync(Buffer.from(before.pages['index.html'], 'base64')).toString().includes('data:image/svg+xml;base64,'));
  env.CODEX_THREAD_ID=project.thread_id;
  preview = spawn(process.execPath, ['dist/server/index.js', '--preview'], { env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  const url = await new Promise((resolve, reject) => { preview.stdout.once('data', bytes => resolve(bytes.toString().trim())); preview.once('error', reject); });
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage(); await page.goto(url);
  await page.locator('.canvas-world').waitFor();
  const frame = page.frameLocator('iframe[title="index.html"]');
  await frame.locator('#hero').waitFor();
  await frame.locator('#hero').evaluate(image => new Promise(resolve => image.complete ? resolve() : image.addEventListener('load', resolve, { once: true })));
  assert.equal(await frame.locator('#hero').evaluate(image => image.naturalWidth), 300);
  const about = await page.locator('iframe[title="about.html"]').getAttribute('src');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=', 'base64');
  await mkdir(join(project.directory, 'assets'));
  await writeFile(join(project.directory, 'assets/生成 图片.png'), png);
  const after = (await call('project_sync', { thread_id: project.thread_id, since: before.revision, known, wait_ms: 1000 }))._meta.sync;
  assert.deepEqual(Object.keys(after.pages).sort(), ['index.html', 'nested/page.html']);
  assert.equal(after.manifest.pages.find(page => page.path === 'about.html').version, known['about.html']);
  const html = gunzipSync(Buffer.from(after.pages['index.html'], 'base64')).toString();
  assert.ok(html.includes('https://website-builder.invalid/preview-assets/'));
  await page.waitForFunction(() => {
    // Opaque iframe is inspected through Playwright below; wait for its blob update.
    return document.querySelectorAll('.page-caption[data-ready="true"]').length === 3;
  });
  await frame.locator('#hero').evaluate(image => new Promise((resolve, reject) => {
    const end = Date.now() + 15000;
    const check = () => image.naturalWidth === 1 ? resolve() : Date.now() > end ? reject(new Error('late image remained placeholder')) : setTimeout(check, 100);
    check();
  })).catch(async () => {
    // The version update replaces the old frame; acquire the new document.
    await frame.locator('#hero').evaluate(image => image.decode());
  });
  assert.equal(await frame.locator('#hero').evaluate(image => image.naturalWidth), 1);
  await frame.locator('#dynamic').evaluate(image => image.decode());
  assert.equal(await frame.locator('#dynamic').evaluate(image => image.naturalWidth), 1);
  assert.equal(await page.locator('iframe[title="about.html"]').getAttribute('src'), about);
  assert.equal(await readFile(join(project.directory, 'index.html'), 'utf8'), original);
  console.log(JSON.stringify({ result: 'PASS', checks: ['late generated asset replaces cached placeholder without rewriting HTML or finish callback', 'encoded spaces/Unicode/query and root-relative nested image paths', 'classic component image resolves against document', 'cross-process UI refresh and unaffected page retention', 'source HTML unchanged'] }));
} finally { await client.close(); if (browser) await browser.close(); if (preview) preview.kill(); }
