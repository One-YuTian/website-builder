import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await mkdir('artifacts', { recursive: true });
  for (const [width, height] of [[1440, 900], [768, 1024], [375, 812]]) {
    await page.setViewportSize({ width, height });
    await page.mouse.move(-10, -10);
    await page.goto(pathToFileURL(resolve('dist/ui/index.html')).href);
    await page.locator('canvas').waitFor();
    await page.mouse.move(-10, -10); await page.waitForTimeout(800);
    const alpha = () => page.locator('canvas').evaluate(canvas => {
      const ctx = canvas.getContext('2d');
      return ctx.getImageData(183, 180, 1, 1).data[3];
    });
    const before = await alpha();
    await page.mouse.move(184, 180);
    await page.waitForTimeout(700);
    assert.ok((await alpha()) > before + 50, 'Nearby dots must gain contrast');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await page.screenshot({ path: `artifacts/canvas-${width}.png` });
    await page.mouse.move(-10, -10);
    await page.waitForTimeout(700);
    console.log({width,before,after:await alpha()});
    assert.ok((await alpha()) <= before + 3, 'Dots must fade back after pointer leaves');
  }
  assert.deepEqual(errors, []);
  console.log('PASS: hover contrast, leave fade, responsive sizes, browser errors');
} finally { await browser.close(); }


