import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto('http://[::1]:4321/header/header-01/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  const rects = await page.evaluate(() => {
    const sw = document.querySelector('.sb-viewport-switcher')?.getBoundingClientRect();
    const ref = document.querySelector('.sb-refresh-btn')?.getBoundingClientRect();
    const code = document.querySelector('.sb-show-code-btn')?.getBoundingClientRect();
    return {
      switcher: { top: sw?.top, height: sw?.height },
      refresh: { top: ref?.top, height: ref?.height },
      showCode: { top: code?.top, height: code?.height },
    };
  });
  console.log('Rects after fix:', JSON.stringify(rects));

  await page.screenshot({ path: '../starlight/starlight-buttons-aligned-verified.png' });
  
  const showBtn = page.locator('.sb-show-code-btn').first();
  await showBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '../starlight/starlight-drawer-js.png' });

  const htmlTab = page.locator('.sbdocs-tab-btn[data-tab="html"]').first();
  await htmlTab.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '../starlight/starlight-drawer-html.png' });

  await browser.close();
})();

