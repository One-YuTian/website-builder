import { test, expect } from '@playwright/test';

async function open(page, width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`/iframe.html?id=components-header-header-02--${width < 768 ? 'mobile' : width === 768 ? 'tablet' : 'pc'}&viewMode=story`);
  const header = page.locator('header-02');
  await expect(header.locator('header')).toBeVisible();
  await expect.poll(() => header.locator('header').evaluate(element => getComputedStyle(element).backgroundImage)).toContain('linear-gradient');
  await page.evaluate(() => {
    window.headerEvents = [];
    for (const name of ['header-navigate', 'header-search', 'header-cart', 'header-logout']) document.addEventListener(name, event => window.headerEvents.push({ name, detail: event.detail }));
  });
  return header;
}

for (const width of [1440, 768, 390]) {
  test(`Header-02 ${width}px 布局、骨架与空白滚动吸顶`, async ({ page }) => {
    const header = await open(page, width);
    expect((await header.innerText()).trim()).toBe('LOGO');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(header.getByRole('button', { name: '购物车，3件' })).toBeVisible();
    await expect(header.locator('img,picture,svg,iframe')).toHaveCount(0);
    await expect(header.locator('[data-region="account-panel"]')).toHaveCount(0);
    if (width >= 768) await expect(header.getByRole('navigation', { name: '主导航', exact: true })).toBeVisible();
    else await expect(header.locator('[data-region="top-bar"]')).toBeHidden();
    if (width >= 1024) await expect(header.locator('[data-region="promotion"]')).toBeVisible();
    else await expect(header.locator('[data-region="promotion"]')).toBeHidden();
    expect(await header.evaluate(element => element.parentElement.children.length)).toBe(1);
    await page.evaluate(() => scrollTo(0, 400));
    await expect.poll(() => header.evaluate(element => element.getBoundingClientRect().top)).toBe(0);
  });
}

test('Header-02 搜索、建议、购物车和认证导航沿用统一接口', async ({ page }) => {
  const header = await open(page);
  await header.getByRole('searchbox').fill('chair');
  await expect(header.locator('[data-product]')).toHaveCount(2);
  await expect(header.locator('[data-region="suggestion-image"] [data-sb2-marker="image"]')).toHaveCount(2);
  await header.getByRole('searchbox').press('Enter');
  expect(await page.evaluate(() => window.headerEvents.at(-1))).toEqual({ name: 'header-search', detail: { query: 'chair' } });
  await header.getByRole('searchbox').fill('lamp');
  await header.getByRole('searchbox').press('ArrowDown');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.headerEvents.at(-1).detail)).toEqual({ destination: 'product', id: 'demo-product-1' });
  await header.getByRole('button', { name: '购物车，3件' }).click();
  expect(await page.evaluate(() => window.headerEvents.at(-1).name)).toBe('header-cart');
  await header.evaluate(element => { element.isLoggedIn = true; element.cartCount = 5; });
  await expect(header.getByRole('button', { name: '购物车，5件' })).toBeVisible();
  await expect(header.getByRole('link', { name: '登录', exact: true })).toBeHidden();
  await header.getByRole('button', { name: '退出登录', exact: true }).click();
  expect(await page.evaluate(() => window.headerEvents.at(-1).name)).toBe('header-logout');
  await header.getByRole('link', { name: '收藏', exact: true }).click();
  expect(await page.evaluate(() => window.headerEvents.at(-1).detail.destination)).toBe('wishlist');
});

test('Header-02 移动购物车及抽屉支持键盘、遮罩和登录状态', async ({ page }) => {
  const header = await open(page, 390);
  await header.evaluate(element => { element.isLoggedIn = true; });
  const trigger = header.getByRole('button', { name: '打开导航菜单' });
  await trigger.click();
  const drawer = header.getByRole('dialog', { name: '移动端导航' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('link', { name: '我的订单', exact: true })).toBeVisible();
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press('Tab');
    expect(await drawer.evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.mouse.click(370, 300);
  await expect(drawer).toBeHidden();
  await trigger.click();
  await drawer.getByRole('link', { name: '商品列表' }).click();
  await expect(drawer).toBeHidden();
  expect(await page.evaluate(() => window.headerEvents.at(-1).detail.destination)).toBe('shop');
});

test('Header-01 与 Header-02 共用接口并保持状态及控件 ID 隔离', async ({ page }) => {
  const second = await open(page);
  await page.evaluate(() => {
    const first = document.createElement('header-01');
    first.isLoggedIn = true;
    first.cartCount = 9;
    document.querySelector('header-02').after(first);
  });
  const first = page.locator('header-01');
  expect(await first.evaluate(element => element.cartCount)).toBe(9);
  expect(await second.evaluate(element => element.cartCount)).toBe(3);
  expect(await first.locator('dialog').getAttribute('id')).not.toBe(await second.locator('dialog').getAttribute('id'));
  await second.getByRole('searchbox').fill('abc');
  await expect(first.locator('[data-product]')).toHaveCount(0);
  await second.evaluate(element => { const parent = element.parentElement; element.remove(); parent.prepend(element); });
  await second.getByRole('button', { name: '购物车，3件' }).click();
  expect(await page.evaluate(() => window.headerEvents.filter(event => event.name === 'header-cart').length)).toBe(1);
});

test('Header-02 Doc和独立入口正常，使用共享宽度且下方无内容', async ({ page, request }) => {
  const { entries } = await (await request.get('/index.json')).json();
  for (const variant of ['doc', 'pc', 'tablet', 'mobile']) expect(entries[`components-header-header-02--${variant}`]).toBeTruthy();
  await page.goto('/?path=/docs/components-header-header-02--doc');
  const frame = page.frameLocator('#storybook-preview-iframe');
  await expect(frame.getByRole('heading', { name: '区域对应表', exact: true })).toBeVisible();
  await expect(frame.getByRole('heading', { name: '来源与重写' })).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/standalone/?component=header-02');
  await expect(page.locator('html')).toHaveAttribute('data-sb2-ready', 'true');
  await expect(page.locator('header-02 header')).toBeVisible();
  await expect(page.locator('main')).toBeHidden();
  const geometry = await page.locator('header-02 [data-region="header-content"]').evaluate(element => {
    const box = element.getBoundingClientRect(); const css = getComputedStyle(element);
    return { width: box.width - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight), center: box.x + box.width / 2 };
  });
  expect(geometry).toEqual({ width: 1200, center: 720 });
  await page.evaluate(() => scrollTo(0, 400));
  await expect.poll(() => page.locator('header-02').evaluate(element => element.getBoundingClientRect().top)).toBe(0);
});
