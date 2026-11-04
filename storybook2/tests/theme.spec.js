import { test, expect } from '@playwright/test';

test('全局主题与内容宽度生效，页头下无演示内容且保持吸顶', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.goto('/iframe.html?id=components-header-header-01--pc&viewMode=story&globals=theme:ocean;contentWidth:1120');
  const header = page.locator('header-01');
  await expect(header.locator('header')).toHaveCSS('background-color', 'rgb(23, 37, 84)');
  await expect(header.locator('[data-region="cart-icon-count"]')).toHaveCSS('background-color', 'rgb(37, 99, 235)');
  await expect(header.locator('[data-region="logo"] [data-sb2-part="shape"]')).toHaveCSS('background-color', 'rgb(219, 234, 254)');
  const geometry = await page.evaluate(() => [...document.querySelectorAll('.content-container')].map(element => {
    const box = element.getBoundingClientRect();
    const css = getComputedStyle(element);
    return { contentWidth: box.width - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight), center: box.x + box.width / 2 };
  }));
  expect(geometry).toHaveLength(1);
  await expect(page.locator('[data-sb2-scroll-content]')).toHaveCount(0);
  expect(await header.evaluate(element => element.parentElement.children.length)).toBe(1);
  for (const box of geometry) { expect(box.contentWidth).toBe(1120); expect(box.center).toBe(960); }
  await page.evaluate(() => window.scrollTo(0, 500));
  await expect.poll(() => header.evaluate(element => element.getBoundingClientRect().top)).toBe(0);
  await expect(header).toHaveCSS('position', 'sticky');
});

test('普通 script 入口无 import，支持共享主题、标准变量和真实 CDN jQuery', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/examples/header-01.html');
  await page.waitForFunction(() => window.ComponentLibrary?.ready);
  const result = await page.evaluate(async () => {
    const result = await ComponentLibrary.ready;
    ComponentLibrary.applyTheme({ preset: 'forest', contentMaxWidth: 1200 });
    return result;
  });
  expect(result.ready).toBe(true);
  await expect(page.locator('header-01 header')).toHaveCSS('background-color', 'rgb(5, 46, 22)');
  await expect(page.locator('header-01')).toHaveCSS('font-family', '"Noto Sans SC", ui-sans-serif, system-ui, sans-serif');
  await expect(page.locator('[data-region="logo"] [data-sb2-part="shape"]')).toHaveCSS('border-radius', '12px');
  await page.getByRole('button', { name: '运行 jQuery 示例' }).click();
  await expect(page.locator('#example-result')).toHaveText('jQuery 已更新购物车数量和登录状态');
  expect(await page.locator('header-01').evaluate(element => ({ isLoggedIn: element.isLoggedIn, cartCount: element.cartCount, wishlistCount: element.wishlistCount }))).toEqual({ isLoggedIn: true, cartCount: 5, wishlistCount: 2 });
  expect(await page.evaluate(() => ComponentLibrary.loadJQuery() === ComponentLibrary.loadJQuery())).toBe(true);
  await expect(page.locator('[data-sb2-resource="jQuery"]')).toHaveCount(1);
  await page.evaluate(() => window.scrollTo(0, 400));
  await expect.poll(() => page.locator('header-01').evaluate(element => element.getBoundingClientRect().top)).toBe(0);
});
