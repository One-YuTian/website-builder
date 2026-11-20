import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { chromium } from '@playwright/test';

const root = await mkdtemp(join(tmpdir(), 'website-product-library-'));
const env = { ...process.env, WEBSITE_BUILDER_DATA_DIR: root };
delete env.WEBSITE_BUILDER_PROJECT_ROOT;
delete env.CODEX_THREAD_ID;

const sampleProducts = [
  {
    id: 'P001',
    name: 'Trail Backpack 28L',
    brand: 'NorthPeak',
    category: 'Backpacks',
    final_price: 89.9,
    original_price: 119.9,
    rating: 4.8,
    reviews_count: 2,
    main_image: 'products/p001-main.jpg',
    images: ['products/p001-main.jpg', 'products/p001-side.jpg'],
    description: 'Durable weather-resistant daypack.',
    specifications: [
      { key: 'Material', value: 'Ripstop Nylon' },
      { key: 'Devolución', value: '30 días' },
      { key: 'Devolución Política', value: 'Política estándar' },
    ],
    comments: [
      { user_name: 'Alice', rating: 5, date: '2026-10-01', content: 'Great bag!', merchant_reply: 'Thanks for your support!' },
      { user_name: 'Bob', rating: 4, date: '2026-10-03', content: 'Very comfortable.' },
    ],
  },
  {
    id: 'P002',
    name: 'Alpine Bottle 750ml',
    brand: 'NorthPeak',
    category: 'Hydration',
    final_price: 24.5,
    rating: 4.6,
    reviews_count: 0,
    main_image: 'products/p002-main.jpg',
    images: ['products/p002-main.jpg'],
    comments: [],
  },
];

// Mock local HTTP server for GET /api/products
const mockServer = http.createServer((req, res) => {
  if (req.url === '/api/products' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ products: sampleProducts }));
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});
await new Promise(resolve => mockServer.listen(0, '127.0.0.1', resolve));
const apiPort = mockServer.address().port;
const apiBaseUrl = `http://127.0.0.1:${apiPort}`;

const client = new Client({ name: 'product-library-test', version: '1' });
const callTool = async (name, args) => {
  const res = await client.callTool({ name, arguments: args });
  assert.ok(!res.isError, `${name} failed: ${JSON.stringify(res)}`);
  return res;
};

let browser;
try {
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [resolve('dist/server/index.js')], env }));

  // 1. Test backend website_control products fetch & error handling
  const fetched = await callTool('website_control', { type: 'products', action: 'fetch', url: apiBaseUrl });
  assert.equal(fetched._meta.control.count, 2);
  assert.equal(fetched._meta.control.url, `${apiBaseUrl}/api/products`);

  const badFetch = await client.callTool({ name: 'website_control', arguments: { type: 'products', action: 'fetch', url: `${apiBaseUrl}/missing/endpoint` } });
  assert.ok(badFetch.isError);
  assert.match(badFetch.content[0].text, /导入失败/);

  // 2. Test UI flow in Playwright with mocked MCP host & requestModal
  const resource = await client.readResource({ uri: 'ui://codex-website-builder/canvas' });
  const rawHtml = resource.contents[0].text;
  const instrument = (html, modalParams) => html.replace(
    '<head>',
    `<head><script>
      window.__sentMessages = [];
      window.__modelContexts = [];
      window.__modalRequests = [];
      window.openai = {
        view: ${JSON.stringify(modalParams ? { mode: 'modal', params: modalParams } : { mode: 'fullscreen' })},
        requestModal: req => {
          window.__modalRequests.push(req);
          return new Promise(resolve => {
            window.__resolveModal = resolve;
          });
        },
        requestClose: () => { window.__modalClosed = true; }
      };
      window.__callTool = null;
    </script>`
  );

  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Route tool calls from browser page to our MCP client
  await page.exposeFunction('mcpCallTool', async (name, args) => {
    const res = await client.callTool({ name, arguments: args });
    return res;
  });

  // Intercept hostApp in bridge or use preview? Let's test via preview-like bridge injection:
  // Actually, let's check how ui.test.mjs or prompt.test.mjs mounts the UI!
  // We can serve the instrumented HTML from a tiny local HTTP server and mock window.parent.postMessage for ext-apps,
  // OR even simpler: test the modal view directly AND test ProjectManager/ProjectPrompt via a small local server!
  const uiServer = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/host') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!doctype html><html><body>
        <iframe id="app" src="/" style="width:1280px;height:800px;border:0"></iframe>
        <script>
          window.__sentMessages = [];
          window.__modelContexts = [];
          window.addEventListener('message', async event => {
            const msg = event.data;
            const frame = document.getElementById('app').contentWindow;
            if (!msg || msg.jsonrpc !== '2.0' || msg.id === undefined) return;
            if (msg.method === 'ui/initialize') {
              frame.postMessage({ jsonrpc: '2.0', id: msg.id, result: { protocolVersion: '2026-01-26', hostCapabilities: { serverTools: {}, updateModelContext: {}, message: { text: {} }, experimental: { 'openai/message': {} } }, hostInfo: { name: 'Test Codex', version: '26.1112.1' }, hostContext: { platform: 'desktop', displayMode: 'fullscreen', theme: 'light' } } }, '*');
            } else if (msg.method === 'tools/call') {
              try {
                const result = await window.mcpCallTool(msg.params.name, msg.params.arguments);
                frame.postMessage({ jsonrpc: '2.0', id: msg.id, result }, '*');
              } catch (err) {
                frame.postMessage({ jsonrpc: '2.0', id: msg.id, error: { code: -32000, message: err.message } }, '*');
              }
            } else if (msg.method === 'ui/update-model-context') {
              window.__modelContexts.push(msg.params);
              frame.postMessage({ jsonrpc: '2.0', id: msg.id, result: {} }, '*');
            } else if (msg.method === 'ui/message') {
              window.__sentMessages.push(msg.params);
              frame.postMessage({ jsonrpc: '2.0', id: msg.id, result: {} }, '*');
            }
          });
        </script>
      </body></html>`);
      return;
    }
    if (url.pathname === '/modal') {
      const panelId = url.searchParams.get('panel_id') || 'panel-test-1234';
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(instrument(rawHtml, { view: 'products', panel_id: panelId }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(instrument(rawHtml, null));
  });
  await new Promise(resolve => uiServer.listen(0, '127.0.0.1', resolve));
  const uiPort = uiServer.address().port;

  // Test 3: Open ProductLibraryModal directly at /modal?panel_id=panel-test-1234
  const modalPage = await context.newPage();
  await modalPage.addInitScript(() => {
    // Minimal MCP ext-apps host bridge mock
    window.addEventListener('message', async event => {
      const msg = event.data;
      if (!msg || msg.jsonrpc !== '2.0' || !msg.id) return;
      if (msg.method === 'ui/initialize') {
        window.postMessage({ jsonrpc: '2.0', id: msg.id, result: { protocolVersion: '2025-11-21', hostCapabilities: {}, hostInfo: { name: 'test', version: '1' }, hostContext: { theme: 'light' } } }, '*');
      } else if (msg.method === 'tools/call') {
        try {
          const result = await window.mcpCallTool(msg.params.name, msg.params.arguments);
          window.postMessage({ jsonrpc: '2.0', id: msg.id, result }, '*');
        } catch (err) {
          window.postMessage({ jsonrpc: '2.0', id: msg.id, error: { code: -32000, message: err.message } }, '*');
        }
      }
    });
  });
  await modalPage.exposeFunction('mcpCallTool', async (name, args) => client.callTool({ name, arguments: args }));
  await modalPage.goto(`http://127.0.0.1:${uiPort}/modal?panel_id=panel-test-1234`);

  // Verify fixed header and disabled Import button initially
  await modalPage.getByRole('heading', { name: '商品库' }).waitFor();
  const importBtn = modalPage.getByRole('button', { name: '导入', exact: true });
  await importBtn.waitFor();
  assert.equal(await importBtn.isDisabled(), true, 'Import button must be disabled before loading data');

  // Test URL error handling
  await modalPage.locator('.products-url-field input').fill(`${apiBaseUrl}/bad`);
  await modalPage.getByRole('button', { name: '获取数据' }).click();
  await modalPage.getByRole('alert').waitFor();
  const alertText = await modalPage.getByRole('alert').textContent();
  assert.match(alertText, /导入失败/);

  // Test Paste JSON mode
  await modalPage.getByRole('tab', { name: '粘贴导入' }).click();
  await modalPage.locator('textarea').fill(JSON.stringify(sampleProducts));
  await modalPage.getByRole('button', { name: '解析并预览' }).click();
  await modalPage.getByRole('status').waitFor();
  assert.match(await modalPage.getByRole('status').textContent(), /导入成功/);

  // Verify table renders product title, discount badge, rating (1 decimal), replies, and import button stays disabled until checked
  await modalPage.getByText('Trail Backpack 28L', { exact: true }).waitFor();
  await modalPage.getByText('25% OFF', { exact: true }).waitFor();
  await modalPage.getByText('1回复').waitFor();
  await modalPage.getByText('4.8', { exact: true }).waitFor();
  await modalPage.getByText('已选 0 项', { exact: true }).waitFor();
  assert.equal(await importBtn.isDisabled(), true, 'Import button must remain disabled until items are selected');

  // Verify 3-step price/discount sort cycle on ↑ and ↓
  await modalPage.getByRole('button', { name: '价格/折扣升序' }).click();
  assert.equal(await modalPage.locator('.products-table tbody tr .product-title-text').first().textContent(), 'Alpine Bottle 750ml');
  await modalPage.getByRole('button', { name: '价格/折扣升序' }).click();
  assert.equal(await modalPage.locator('.products-table tbody tr .product-title-text').first().textContent(), 'Trail Backpack 28L');
  await modalPage.getByRole('button', { name: '价格/折扣升序' }).click();

  await modalPage.getByRole('button', { name: '价格/折扣降序' }).click();
  assert.equal(await modalPage.locator('.products-table tbody tr .product-title-text').first().textContent(), 'Trail Backpack 28L');
  await modalPage.getByRole('button', { name: '价格/折扣降序' }).click();
  assert.equal(await modalPage.locator('.products-table tbody tr .product-title-text').first().textContent(), 'Trail Backpack 28L');
  await modalPage.getByRole('button', { name: '价格/折扣降序' }).click();

  // Verify image list settings popover: N=2 updates main_image & slices prior images, falls back to N-1 when missing
  await modalPage.getByRole('button', { name: '图片列表设置' }).click();
  await modalPage.locator('.products-img-opt-nth input[type="radio"]').check();
  assert.equal(await modalPage.locator('.products-img-nth-input').inputValue(), '2');
  await modalPage.locator('.products-img-settings-footer button', { hasText: '确认' }).click();
  // Trail Backpack 28L originally had 2 mini thumbs, now only 1 (p001-side.jpg)
  assert.equal(await modalPage.locator('.products-table tbody tr').first().locator('.product-mini-thumb').count(), 1);
  // Switch back to default "使用主图"
  await modalPage.getByRole('button', { name: '图片列表设置' }).click();
  await modalPage.getByRole('radio', { name: '使用主图' }).check();
  await modalPage.locator('.products-img-settings-footer button', { hasText: '确认' }).click();
  assert.equal(await modalPage.locator('.products-table tbody tr').first().locator('.product-mini-thumb').count(), 2);

  // Verify clicking row opens single-item detail view, filters non-product specs, and footer has only "返回" and "下一个"
  await modalPage.getByText('Trail Backpack 28L', { exact: true }).click();
  await modalPage.getByText('Thanks for your support!').waitFor();
  await modalPage.getByText('Ripstop Nylon', { exact: true }).waitFor();
  assert.equal(await modalPage.getByText('Devolución').count(), 0, 'Non-product policy specs must be filtered out');
  await modalPage.getByRole('button', { name: '下一个', exact: true }).click();
  await modalPage.getByText('Alpine Bottle 750ml').waitFor();
  await modalPage.getByRole('button', { name: '返回', exact: true }).click();

  // Test .txt file import
  await modalPage.getByRole('tab', { name: '文件导入' }).click();
  const txtPath = join(root, 'products.txt');
  await writeFile(txtPath, JSON.stringify(sampleProducts));
  await modalPage.locator('input[type="file"]').setInputFiles(txtPath);
  await modalPage.getByText('已加载 2 件商品', { exact: true }).waitFor();

  // Select all items so Import becomes enabled
  await modalPage.getByRole('checkbox', { name: '全选商品' }).check();
  await modalPage.getByText('已选 2 项', { exact: true }).waitFor();
  assert.equal(await importBtn.isDisabled(), false, 'Import button must be enabled after selecting items');

  // Click Import -> stages products for panel-test-1234 and closes modal
  await importBtn.click();
  await modalPage.waitForFunction(() => window.__modalClosed === true);
  const staged = await callTool('website_control', { type: 'products', action: 'get', panel_id: 'panel-test-1234' });
  assert.equal(staged._meta.control.has_products, true);
  assert.equal(staged._meta.control.count, 2);

  // 4. Verify backend create imports files/data.json + renames conflicting data.json + creates .gitignore
  const panelId = 'panel-create-1234';
  await callTool('website_control', { type: 'products', action: 'import', panel_id: panelId, raw_json: JSON.stringify(sampleProducts) });
  await callTool('website_projects', { action: 'submission', panel_id: panelId, request_id: 'req-create-1234', submission_start: true, file_count: 1, has_product_library: true, requirement: '[商品2件] [data_1.json]' });

  const userBytes = Buffer.from(JSON.stringify({ user: true }), 'utf8');
  const { createHash } = await import('node:crypto');
  const sha = createHash('sha256').update(userBytes).digest('hex');
  await callTool('website_projects', {
    action: 'upload', panel_id: panelId, request_id: 'req-create-1234',
    upload_id: 'upload-12345678', file_name: 'data_1.json', mime_type: 'application/json',
    total_size: userBytes.length, sha256: sha, chunk: userBytes.toString('base64'), offset: 0, final: true,
  });

  const createdRes = await callTool('website_projects', {
    action: 'create', panel_id: panelId, request_id: 'req-create-1234', thread_id: 'thread-prod-lib', name: 'Product Lib Site',
  });
  const created = JSON.parse(createdRes.content[0].text);
  assert.deepEqual(
    JSON.parse(await readFile(join(created.project_directory, 'files', 'data.json'), 'utf8')),
    sampleProducts
  );
  assert.deepEqual(
    JSON.parse(await readFile(join(created.project_directory, 'files', 'data_1.json'), 'utf8')),
    { user: true }
  );

  // 5. Verify .gitignore exists and ignores .gitignore, files/, material/, node_modules/
  const gitignore = await readFile(join(created.project_directory, '.gitignore'), 'utf8');
  for (const entry of ['.gitignore', 'files/', 'material/', 'node_modules/']) {
    assert.ok(gitignore.includes(entry), `.gitignore should include ${entry}`);
  }
  const git = createRequire(import.meta.url)(resolve('dist/runtime/isomorphic-git/load.cjs'));
  const fs = await import('node:fs').then(m => m.default);
  const tracked = await git.listFiles({ fs, dir: created.project_directory.replaceAll('\\', '/') });
  assert.ok(tracked.includes('README.md'));
  assert.ok(!tracked.includes('.gitignore'), '.gitignore itself should be ignored');
  assert.ok(!tracked.some(p => p.startsWith('files/') || p.startsWith('material/')), 'files/ and material/ should be ignored');

  // 6. Verify home page shows "+ 商品库" button and capsule chip when staged
  await page.goto(`http://127.0.0.1:${uiPort}/host`);
  const frame = page.frameLocator('#app');
  const libBtn = frame.getByRole('button', { name: '商品库' });
  await libBtn.waitFor();
  assert.equal(await libBtn.textContent(), '商品库');
  assert.equal(await libBtn.locator('svg').count(), 1);

  // Click "+ 商品库", stage products for the active panel_id, and resolve requestModal
  await libBtn.click();
  await page.waitForFunction(() => document.getElementById('app').contentWindow.__modalRequests.length === 1);
  const modalReq = await page.evaluate(() => document.getElementById('app').contentWindow.__modalRequests[0]);
  assert.equal(modalReq.title, '商品库');
  assert.equal(modalReq.params.view, 'products');
  await callTool('website_control', { type: 'products', action: 'import', panel_id: modalReq.params.panel_id, raw_json: JSON.stringify(sampleProducts) });
  await page.evaluate(() => document.getElementById('app').contentWindow.__resolveModal(true));

  // Verify capsule chip "2件商品" appears in prompt editor
  await frame.locator('.prompt-chip[data-chip-kind="product-library"]').waitFor();
  assert.equal(await frame.locator('.prompt-chip[data-chip-kind="product-library"] .chip-title').textContent(), '2件商品');
  assert.ok(await frame.locator('.prompt-chip[data-chip-kind="product-library"] img.chip-data-icon').getAttribute('src'));

  // Also attach a conflicting data.json file and submit
  const userDataPath = join(root, 'data.json');
  await writeFile(userDataPath, JSON.stringify({ fromUser: true }));
  await frame.locator('input[type="file"][aria-label="选择图片或文件"]').setInputFiles(userDataPath);
  await frame.locator('.prompt-chip[data-file-name="data.json"]').waitFor();

  await frame.getByRole('button', { name: '发送需求' }).click();
  await page.waitForFunction(() => window.__sentMessages.length === 1);
  const sent = await page.evaluate(() => window.__sentMessages[0]);
  const textPart = sent.content.find(c => c.type === 'text').text;
  assert.match(textPart, /\[商品2件\]/);
  assert.match(textPart, /\[data_1\.json\]/);
  const links = sent.content.filter(c => c.type === 'resource_link');
  assert.equal(links[0].name, '商品2件');
  assert.equal(links[0].uri, 'ui://codex-website-builder/files/data.json');
  assert.equal(links[1].name, 'data_1.json');
  assert.equal(links[1].uri, 'ui://codex-website-builder/files/data_1.json');

  const ctx = await page.evaluate(() => window.__modelContexts.at(-1));
  assert.match(ctx.structuredContent.submission.instructions, /不再从用户上传的其他附件中读取商品数据/);

  uiServer.close();
  console.log('PASS: product library button, modal (URL/file/paste/table/detail/cdn), data.json collision rename, capsule chip, Codex context, and .gitignore');
} finally {
  if (browser) await browser.close();
  mockServer.close();
  await client.close();
}
