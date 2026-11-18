import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, join, extname, sep } from 'node:path';
import { chromium } from '@playwright/test';

const docs = resolve('../starlight'), dist = join(docs, 'dist');
const maps = JSON.parse(await readFile(join(docs, 'public/region-maps.json'), 'utf8'));
const catalog = JSON.parse(await readFile('skills/website-builder/catalog.json', 'utf8'));
assert.equal(maps.length, catalog.length);
for (const entry of catalog) {
  const map = maps.find(map => map.id === entry.id);
  assert.ok(map?.areas.length, `${entry.id} has documented regions`);
  assert.equal(new Set(map.areas.map(area => area.letter)).size, map.areas.length);
  const source = await readFile(join(docs, 'public/llms', entry.file));
  for (const base of [join(dist, 'llms'), resolve('../.agents/skills/website-builder/templates'), resolve('skills/website-builder/templates')]) {
    assert.deepEqual(await readFile(join(base, entry.file)), source, `exact generated template: ${base}/${entry.file}`);
  }
  const text = source.toString();
  assert.equal((text.match(/^## Overview$/gm) || []).length, 1);
  for (const area of map.areas) assert.ok(text.includes(area.label), `${entry.id}: ${area.label}`);
  assert.ok(!text.includes('loadResources(') && !text.includes('applyTheme('), 'no standalone demo resource/theme injection');
}
const card = maps.find(map => map.id === 'card-11');
const cardText = await readFile(join(dist, 'llms/components/card/card-11.txt'), 'utf8');
assert.ok(!cardText.includes('add-to-cart & wishlist interactions') && !cardText.includes('140px fixed thumbnail'), 'shared card README must not invent variant features or dimensions');
assert.ok(cardText.includes('product-id defaults to `product-01`'));
assert.match(card.areas[0].label, /A区域-评分$/);
assert.match(card.areas[1].label, /B区域-价格$/);
assert.ok(card.areas.some(area => /折扣标签/.test(area.label) && /不是评论数量/.test(area.displays)));

const server = createServer(async (req, res) => {
  try {
    let file = resolve(dist, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(dist + sep) && file !== dist) throw Error('invalid path');
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' })[extname(file)] || 'text/plain');
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Keep the documentation check independent of CDN availability.
  await page.route('https://**/*', route => route.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/components/card/card-11/`, { waitUntil: 'domcontentloaded' });
  await page.locator('.region-map[data-initialized="true"]').waitFor();
  assert.equal(await page.locator('.region-map tbody tr').count(), card.areas.length);
  // Test the region locator against a minimal actual-render baseline, with local CSS only.
  const { renderedMarkup } = await import('../../starlight/scripts/region-map.mjs');
  for (const map of maps) {
    const folder = `../storybook2/src/components/${map.id}`;
    const source = await readFile(`${folder}/index.js`, 'utf8');
    let fallback = '';
    try { fallback = await readFile(`${folder}/template.html`, 'utf8'); } catch {}
    const html = /extends\s+HTMLElement/.test(source) ? renderedMarkup(source, fallback).html : fallback;
    const missing = await page.evaluate(({ html, areas }) => {
      const root = document.createElement('div');
      root.innerHTML = html;
      return areas.flatMap(area => area.selectors.filter(selector => !root.querySelector(selector)).map(selector => `${area.label}: ${selector}`));
    }, { html, areas: map.areas });
    assert.deepEqual(missing, [], `${map.id}: all region selectors resolve in the documented render baseline`);
  }
  const js = await readFile('../storybook2/src/components/card-11/index.js', 'utf8');
  const html = renderedMarkup(js, '').html;
  await page.locator('.sbdocs-preview-iframe').evaluate((iframe, html) => {
    iframe.srcdoc = `<style>div,button,span{min-height:12px;min-width:12px;display:block}</style><card-11>${html}</card-11>`;
  }, html);
  await page.waitForFunction(() => document.querySelector('iframe').contentDocument?.querySelector('card-11'));
  for (const letter of ['A', 'B', 'C']) {
    await page.getByRole('button', { name: `定位 ${letter}`, exact: true }).click();
    await page.waitForFunction(letter => document.querySelector('iframe').contentDocument?.querySelector('[data-doc-region-label]')?.textContent === letter, letter);
    assert.match(await page.locator('.region-feedback').innerText(), /已定位/);
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ result: 'PASS', templates: maps.length, regions: maps.reduce((count, map) => count + map.areas.length, 0), checks: ['all region labels included in LLM text', 'all region selectors resolve in actual render baselines', 'built/public/two skill template copies byte-identical', 'Card-11 rating/price/image semantics', 'built Starlight region locator A/B/C'] }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
