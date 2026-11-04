import { test, expect } from '@playwright/test';
import { parse } from 'acorn';
import { catalog } from '../src/catalog.js';

async function openPlayground(page) {
  await page.goto('/playground/index.html');
  await expect(page.locator('html')).toHaveAttribute('data-playground-ready', 'true');
  const frame = page.frameLocator('#preview');
  await expect(frame.locator('html')).toHaveAttribute('data-preview-ready', 'true');
  return frame;
}

for (const id of ['carousel-01', 'carousel-03']) for (const width of [768, 390]) {
  test(`${id} ${width}px 使用独立小屏轮播与正确图片比例`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/iframe.html?id=blocks-carousel-${id}--mobile&viewMode=story`);
    await expect(page.locator(id)).toBeHidden();
    const mobile = page.locator(`${id}-mobile`);
    await expect(mobile).toBeVisible();
    await mobile.evaluate(element => { element.paused = true; });
    await expect(mobile.locator('[data-index]')).toHaveCount(id === 'carousel-01' ? 2 : 3);
    const ratio = await mobile.locator('[data-region="carousel-stage"]').evaluate(element => { const box = element.getBoundingClientRect(); return box.width / box.height; });
    expect(ratio).toBeCloseTo(id === 'carousel-01' ? 50 / 21 : 60 / 17, 1);
    await mobile.getByRole('button', { name: '切换到第2张' }).click();
    await expect(mobile).toHaveAttribute('data-active-index', '1');
    if (id === 'carousel-03') {
      const rail = mobile.locator('[data-region="mobile-categories"]');
      expect(await rail.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
      await mobile.evaluate(element => { window.categoryEvents = []; element.addEventListener('carousel-navigate', event => window.categoryEvents.push(event.detail)); });
      await rail.getByRole('link', { name: '查看分类 2', exact: true }).click();
      expect(await page.evaluate(() => window.categoryEvents)).toEqual([{ categoryId: 'category-02' }]);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('每份组合示例含实际类实现且可作为经典脚本解析，无项目入口依赖', async ({ request }) => {
  for (const entry of [...catalog, { id: 'skeleton-placeholder' }]) for (const variant of ['desktop', 'mobile', 'responsive']) {
    const result = await request.get(`/code/${entry.id}-${variant}.html`);
    expect(result.ok()).toBe(true);
    const html = await result.text();
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('extends HTMLElement');
    expect(html).not.toMatch(/ComponentLibrary|\/library\/component-library|^\s*import\s/m);
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    expect(scripts.length).toBeGreaterThan(0);
    for (const script of scripts) expect(() => parse(script[1], { ecmaVersion: 'latest', sourceType: 'script' })).not.toThrow();
  }
});

test('复制出的响应式HTML无需原项目也能在Mobile切换及操作', async ({ page, request }) => {
  const html = await (await request.get('/code/carousel-03-responsive.html')).text();
  const localRequests = [];
  page.on('request', request => { if (request.url().includes('6010')) localRequests.push(request.url()); });
  await page.route('http://copied.test/**', route => route.fulfill({ body: html, contentType: 'text/html' }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://copied.test/example.html');
  await expect(page.locator('html')).toHaveAttribute('data-example-ready', 'true');
  await expect(page.locator('carousel-03')).toBeHidden();
  const mobile = page.locator('carousel-03-mobile');
  await expect(mobile).toBeVisible();
  await mobile.evaluate(element => { element.paused = true; });
  await mobile.getByRole('button', { name: '切换到第3张' }).click();
  await expect(mobile).toHaveAttribute('data-active-index', '2');
  expect(await page.evaluate(() => typeof window.ComponentLibrary)).toBe('undefined');
  await expect(page.locator('[data-sb2-resource="Tailwind"]')).toHaveCount(1);
  expect(await page.evaluate(() => window.jQuery.fn.jquery)).toBe('3.7.1');
  expect(localRequests).toEqual([]);
});

test('Playground自由添加、排序、删除并分别配置视口及内容宽度', async ({ page }) => {
  const frame = await openPlayground(page);
  await expect(page.locator('#sequence li')).toHaveCount(4);
  await page.getByRole('button', { name: '添加 Footer-02', exact: true }).click();
  await expect(page.locator('#sequence li')).toHaveCount(5);
  await page.getByRole('button', { name: '上移 Footer-02 第5项', exact: true }).click();
  await expect(page.locator('#sequence li').nth(3)).toContainText('Footer-02');
  await page.getByRole('button', { name: '删除 Footer-01 第5项', exact: true }).click();
  await expect(frame.locator('footer-01')).toHaveCount(0);
  await expect(frame.locator('footer-02')).toBeVisible();
  await page.getByRole('button', { name: 'Mobile', exact: true }).click();
  await expect.poll(() => frame.locator('html').evaluate(() => innerWidth)).toBe(390);
  await expect(frame.locator('carousel-01-mobile')).toBeVisible();
  await expect(frame.locator('carousel-01')).toBeHidden();
  await page.locator('#content-width').fill('900'); await page.locator('#content-width').press('Tab');
  await page.getByRole('button', { name: 'PC', exact: true }).click();
  await expect.poll(() => frame.locator('html').evaluate(() => innerWidth)).toBe(1440);
  await expect.poll(() => frame.locator('header-01 [data-region="header-content"]').evaluate(element => { const css = getComputedStyle(element); return element.getBoundingClientRect().width - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight); })).toBe(900);
  await page.locator('#theme').selectOption('ocean');
  await expect(frame.locator('header-01 header')).toHaveCSS('background-color', 'rgb(23, 37, 84)');
});

test('Playground属性应用、移除属性恢复默认、错误提示与本地保存', async ({ page }) => {
  let frame = await openPlayground(page);
  await page.locator('#properties').fill('{"isLoggedIn":true,"cartCount":7}');
  await page.getByRole('button', { name: '应用属性', exact: true }).click();
  await expect.poll(() => frame.locator('header-01').evaluate(element => element.cartCount)).toBe(7);
  await expect(frame.locator('header-01')).toHaveAttribute('is-logged-in', '');
  await page.locator('#properties').fill('{"cartCount":2}');
  await page.getByRole('button', { name: '应用属性', exact: true }).click();
  await expect(frame.locator('header-01')).not.toHaveAttribute('is-logged-in');
  await page.locator('#properties').fill('{"unknown":1}');
  await page.getByRole('button', { name: '应用属性', exact: true }).click();
  await expect(page.locator('#status')).toContainText('不支持的属性');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-playground-ready', 'true');
  frame = page.frameLocator('#preview');
  await expect.poll(() => frame.locator('header-01').evaluate(element => element.cartCount)).toBe(2);
});

test('Playground导出整页HTML保留组合顺序、Mobile实现并且资源只加载一次', async ({ page, context }) => {
  await openPlayground(page);
  await page.getByRole('button', { name: '查看组合代码', exact: true }).click();
  const html = await page.locator('#code-output').inputValue();
  expect(html).toContain('class Header01');
  expect(html).toContain('class Carousel01Mobile');
  expect(html).not.toContain('ComponentLibrary');
  const copy = await context.newPage();
  await copy.setViewportSize({ width: 390, height: 844 });
  await copy.route('http://composition.test/**', route => route.fulfill({ body: html, contentType: 'text/html' }));
  await copy.goto('http://composition.test/index.html');
  await expect(copy.locator('html')).toHaveAttribute('data-example-ready', 'true');
  await expect(copy.locator('header-01')).toBeVisible();
  await expect(copy.locator('carousel-01-mobile')).toBeVisible();
  await expect(copy.locator('productlist-01 card-01')).toHaveCount(6);
  await expect(copy.locator('footer-01')).toBeVisible();
  await expect(copy.locator('[data-sb2-resource="Tailwind"]')).toHaveCount(1);
  await expect(copy.locator('[data-sb2-resource="Google Fonts"]')).toHaveCount(1);
  await expect(copy.locator('[data-sb2-resource="jQuery"]')).toHaveCount(1);
  await expect(copy.locator('[data-sb2-theme]')).toHaveCount(1);
  await copy.evaluate(() => scrollTo(0, 500));
  await expect.poll(() => copy.locator('header-01').evaluate(element => element.getBoundingClientRect().top)).toBe(0);
  await copy.close();
});
