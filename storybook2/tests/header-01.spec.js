import { catalog } from '../src/catalog.js';
import { test, expect } from '@playwright/test';

async function open(page, story = 'pc', width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`/iframe.html?id=components-header-header-01--${story}&viewMode=story`);
  const header = page.locator('header-01').first();
  await expect(header.locator('header')).toBeVisible();
  await expect(header.locator('header')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await page.evaluate(() => {
    window.headerEvents = [];
    for (const name of ['header-navigate', 'header-search', 'header-search-input', 'header-cart', 'header-logout', 'header-menu-change']) {
      document.addEventListener(name, event => window.headerEvents.push({ name, detail: event.detail }));
    }
  });
  return header;
}

for (const width of [1440, 768, 390]) {
  test(`Header-01 ${width}px 布局及全部可见内容骨架化`, async ({ page }) => {
    const header = await open(page, width < 768 ? 'mobile' : width === 768 ? 'tablet' : 'pc', width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    expect((await header.innerText()).trim()).toBe('LOGO');
    await expect(header.locator('[data-region="logo"] [data-sb2-marker="logo"]')).toBeVisible();
    await expect(header.locator('img,svg,picture,iframe,[aria-busy]')).toHaveCount(0);
    await expect(header.getByRole('searchbox')).toHaveAccessibleName('搜索商品');
    await expect(header.getByRole('searchbox')).not.toHaveAttribute('placeholder');
    if (width < 768) {
      await expect(header.getByRole('navigation', { name: '主导航', exact: true })).toBeHidden();
      await expect(header.getByRole('button', { name: '打开导航菜单' })).toBeVisible();
    } else {
      await expect(header.getByRole('navigation', { name: '主导航', exact: true })).toBeVisible();
      await expect(header.getByRole('button', { name: '购物车，3件' })).toBeVisible();
    }
  });
}

test('搜索只提交非空 query，动态建议、键盘选择及外部关闭', async ({ page }) => {
  const header = await open(page);
  const input = header.getByRole('searchbox');
  await input.press('Enter');
  expect(await page.evaluate(() => window.headerEvents.filter(event => event.name === 'header-search'))).toHaveLength(0);
  await input.fill('  desk  ');
  await expect(header.locator('[data-region="search-placeholder"]')).toBeHidden();
  await expect(header.locator('[data-product]')).toHaveCount(2);
  await input.press('ArrowDown');
  await expect(header.locator('[data-product]').first()).toBeFocused();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.headerEvents.at(-1))).toEqual({ name: 'header-navigate', detail: { destination: 'product', id: 'demo-product-1' } });
  await input.press('Enter');
  expect(await page.evaluate(() => window.headerEvents.at(-1))).toEqual({ name: 'header-search', detail: { query: 'desk' } });
  await input.fill('ab');
  await input.press('Escape');
  await expect(header.locator('[data-region="search-suggestions"]')).toBeHidden();
  await input.fill('xy');
  await page.mouse.click(10, 300);
  await expect(header.locator('[data-region="search-suggestions"]')).toBeHidden();
  await input.fill('');
  await expect(header.locator('[data-region="search-placeholder"]')).toBeVisible();
});

test('未登录入口、认证状态、账户弹层、导航及购物车只发出事件', async ({ page }) => {
  const header = await open(page);
  await header.getByRole('button', { name: '账户', exact: true }).click();
  expect(await page.evaluate(() => window.headerEvents.at(-1))).toEqual({ name: 'header-navigate', detail: { destination: 'login' } });
  await header.getByRole('button', { name: '收藏，2件' }).click();
  expect(await page.evaluate(() => window.headerEvents.at(-1).detail.destination)).toBe('login');
  await header.evaluate(element => { element.isLoggedIn = true; });
  const account = header.getByRole('button', { name: '账户', exact: true });
  await account.click();
  await expect(header.locator('[data-region="account-panel"]')).toBeVisible();
  await account.press('Escape');
  await expect(account).toBeFocused();
  await expect(account).toHaveAttribute('aria-expanded', 'false');
  await account.click();
  await page.mouse.click(10, 300);
  await expect(header.locator('[data-region="account-panel"]')).toBeHidden();
  await account.click();
  await header.locator('[data-region="account-panel"]').getByRole('button', { name: '退出登录' }).click();
  expect(await page.evaluate(() => window.headerEvents.at(-1).name)).toBe('header-logout');
  await expect(header).toHaveAttribute('is-logged-in', '');
  await header.getByRole('button', { name: '收藏，2件' }).click();
  expect(await page.evaluate(() => window.headerEvents.at(-1).detail.destination)).toBe('wishlist');
  await header.getByRole('button', { name: '购物车，3件' }).click();
  expect(await page.evaluate(() => window.headerEvents.at(-1).name)).toBe('header-cart');
  await header.getByRole('link', { name: '商品列表', exact: true }).click();
  expect(await page.evaluate(() => window.headerEvents.at(-1).detail.destination)).toBe('shop');
  expect(new URL(page.url()).hash).toBe('');
});

test('移动抽屉焦点循环、Esc、遮罩、导航及断点关闭', async ({ page }) => {
  const header = await open(page, 'mobile', 390);
  const trigger = header.getByRole('button', { name: '打开导航菜单' });
  const drawer = header.getByRole('dialog', { name: '移动端导航' });
  await trigger.click();
  await expect(drawer).toBeVisible();
  expect((await drawer.innerText()).trim()).toBe('LOGO');
  await expect(header.getByRole('button', { name: '关闭导航菜单' })).toBeFocused();
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press('Tab');
    expect(await drawer.evaluate(element => element.contains(document.activeElement))).toBeTruthy();
  }
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.mouse.click(370, 300);
  await expect(drawer).toBeHidden();
  await trigger.click();
  await drawer.getByRole('link', { name: '商品列表', exact: true }).click();
  await expect(drawer).toBeHidden();
  expect(await page.evaluate(() => window.headerEvents.at(-1))).toEqual({ name: 'header-navigate', detail: { destination: 'shop' } });
  await trigger.click();
  await page.setViewportSize({ width: 768, height: 900 });
  await expect(drawer).toBeHidden();
  expect(await page.evaluate(() => document.querySelectorAll(':modal').length)).toBe(0);
});

test('Header-01 按文案字号展示骨架层级，搜索图片具有标识', async ({ page }) => {
  const header = await open(page);
  const desktopNavigation = header.getByRole('navigation', { name: '主导航', exact: true });
  await expect(desktopNavigation.locator('[data-sb2-part="shape"]').first()).toHaveCSS('height', '12.75px');
  await expect(header.locator('[data-region="search-placeholder"] [data-sb2-part="shape"]')).toHaveCSS('height', '14.25px');
  await header.getByRole('searchbox').fill('ab');
  await expect(header.locator('[data-region="suggestion-image"] [data-sb2-marker="image"]')).toHaveCount(2);
  await expect(header.locator('[data-region="suggestion-title"] [data-sb2-part="shape"]').first()).toHaveCSS('height', '14.25px');
  await expect(header.locator('[data-region="suggestion-price"] [data-sb2-part="shape"]').first()).toHaveCSS('height', '12.75px');
  await page.setViewportSize({ width: 390, height: 900 });
  await header.getByRole('button', { name: '打开导航菜单' }).click();
  await expect(header.getByRole('dialog').locator('[data-region="navigation-label"] [data-sb2-part="shape"]').first()).toHaveCSS('height', '15.75px');
  await expect(header.locator('[data-region="drawer-logo"] [data-sb2-marker="logo"]')).toBeVisible();
});

test('多实例状态和 ID 隔离，移除重连后不重复监听', async ({ page }) => {
  await open(page, 'mobile', 390);
  await page.evaluate(() => {
    const first = document.querySelector('header-01');
    const second = document.createElement('header-01');
    second.isLoggedIn = true;
    second.cartCount = 5;
    first.after(second);
  });
  const headers = page.locator('header-01');
  await expect(headers).toHaveCount(2);
  expect(await headers.nth(0).locator('dialog').getAttribute('id')).not.toBe(await headers.nth(1).locator('dialog').getAttribute('id'));
  await headers.nth(0).getByRole('button', { name: '打开导航菜单' }).click();
  await expect(headers.nth(0).locator('dialog')).toBeVisible();
  await expect(headers.nth(1).locator('dialog')).toBeHidden();
  await page.keyboard.press('Escape');
  await headers.nth(0).evaluate(element => { const parent = element.parentNode; element.remove(); parent.prepend(element); });
  await page.evaluate(() => { window.headerEvents = []; });
  await headers.nth(0).getByRole('button', { name: '打开导航菜单' }).click();
  expect(await page.evaluate(() => window.headerEvents.filter(event => event.name === 'header-menu-change' && event.detail.open).length)).toBe(1);
  await headers.nth(0).evaluate(element => element.remove());
  expect(await page.evaluate(() => document.querySelectorAll(':modal').length)).toBe(0);
  await headers.nth(0).getByRole('button', { name: '账户', exact: true }).click();
  expect(await page.evaluate(() => window.headerEvents.at(-1).detail.destination)).toBe('orders');
});

test('Header-01 的 Doc 和三个视口故事已收录，区域说明正常显示', async ({ page, request }) => {
  const { entries } = await (await request.get('/index.json')).json();
  for (const variant of ['doc', 'pc', 'tablet', 'mobile']) expect(entries[`components-header-header-01--${variant}`]).toBeTruthy();
  for (const variant of ['authenticated', 'multiple-instances']) expect(entries[`components-header-header-01--${variant}`]).toBeUndefined();
  expect(Object.values(entries).find(entry => entry.type === 'docs' && entry.title === 'Components/Header')).toBeTruthy();
  await page.goto('/?path=/docs/components-header-header-01--doc');
  const frame = page.frameLocator('#storybook-preview-iframe');
  await expect(frame.getByRole('heading', { name: '区域对应表', exact: true })).toBeVisible();
  await expect(frame.getByRole('table').filter({ hasText: '区域标识' })).toContainText('suggestion-price');
  await expect(frame.getByRole('heading', { name: '来源与重写' })).toHaveCount(0);
});

test('Header-01 通过统一入口独立运行，目录名称及迁移数量同步', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/standalone/?component=header-01');
  await expect(page.locator('html')).toHaveAttribute('data-sb2-ready', 'true');
  await expect(page.locator('#component-preview header-01')).toBeVisible();
  await expect(page.locator('main')).toBeHidden();
  await expect(page.locator('#status')).toContainText(`业务组件迁移数：${catalog.length}`);
  await page.evaluate(() => window.scrollTo(0, 400));
  await expect.poll(() => page.locator('header-01').evaluate(element => element.getBoundingClientRect().top)).toBe(0);
  await page.getByRole('button', { name: '打开导航菜单' }).click();
  await expect(page.getByRole('dialog', { name: '移动端导航' })).toBeVisible();
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
