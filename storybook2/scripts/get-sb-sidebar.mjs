import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:6008/?path=/docs/components-card-card-01--doc', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  const sidebarData = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#storybook-explorer-tree button, #storybook-explorer-tree a'));
    return items.map(el => ({
      tag: el.tagName,
      id: el.id,
      text: el.textContent?.trim(),
      paddingLeft: window.getComputedStyle(el).paddingLeft,
      color: window.getComputedStyle(el).color,
      fontSize: window.getComputedStyle(el).fontSize,
      fontWeight: window.getComputedStyle(el).fontWeight,
    }));
  });
  console.log('Sidebar items:', JSON.stringify(sidebarData, null, 2));

  await browser.close();
})();

