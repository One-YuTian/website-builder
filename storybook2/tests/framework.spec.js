import { test, expect } from '@playwright/test';

async function ready(page) {
  await page.goto('/standalone/');
  await expect(page.locator('html')).toHaveAttribute('data-sb2-ready', 'true');
  await expect.poll(() => page.locator('[data-region="media"] [data-sb2-part="shape"]').evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
}

test('Storybook 索引、说明文档与基础 Story 均可访问', async ({ page, request }) => {
  const response = await request.get('/index.json');
  expect(response.ok()).toBeTruthy();
  const { entries } = await response.json();
  for (const id of ['guide-getting-started--introduction', 'guide-getting-started--migration', 'foundations-skeleton--doc', 'foundations-skeleton--pc', 'foundations-skeleton--tablet', 'foundations-skeleton--mobile']) expect(entries[id], id).toBeTruthy();
  await page.goto('/iframe.html?id=guide-getting-started--introduction&viewMode=story');
  await expect(page.getByRole('heading', { name: 'storybook2 · 精简组件库' })).toBeVisible();
  await page.goto('/?path=/docs/foundations-skeleton--doc');
  const frame = page.frameLocator('#storybook-preview-iframe');
  await expect(frame.getByText('静态装饰骨架，无真实图片或业务文案', { exact: false }).first()).toBeVisible();
});

for (const width of [1440, 768, 390]) {
  test(`${width}px 真实视口、骨架内容、动态 Tailwind 与键盘操作`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await ready(page);
    const demo = page.locator('[data-sb2-demo]');
    expect(await page.evaluate(() => innerWidth)).toBe(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    expect(await demo.innerText()).toBe('');
    await expect(demo.locator('img,picture,svg,iframe,[aria-busy="true"]')).toHaveCount(0);
    await expect(demo.locator('button')).toHaveAccessibleName('切换骨架圆角');
    await demo.locator('button').focus();
    await page.keyboard.press('Space');
    await expect(demo.locator('button')).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Enter');
    await expect(demo.locator('button')).toHaveAttribute('aria-pressed', 'false');
    const columns = await demo.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(width < 640 ? 1 : 2);
    await page.evaluate(() => {
      const element = document.createElement('skeleton-placeholder');
      element.id = 'dynamic';
      element.setAttribute('kind', 'circle');
      document.querySelector('[data-sb2-demo]').append(element);
    });
    await expect(page.locator('#dynamic span span')).toHaveCSS('width', '48px');
    expect(await page.locator('#dynamic span span').evaluate(element => Number.parseFloat(getComputedStyle(element).borderRadius))).toBeGreaterThan(1000);
    await expect(page.locator('#dynamic span span')).toHaveCSS('animation-name', 'none');
  });
}

test('公共入口重复调用、资源去重、多实例与属性隔离', async ({ page }) => {
  await page.goto('/iframe.html?id=foundations-skeleton--pc&viewMode=story');
  const demo = page.locator('[data-sb2-demo]');
  await expect(demo).toBeVisible();
  // 使用 Storybook 自身挂载/卸载验证同一文档内多次加载；不依赖开发源文件路径。
  await page.evaluate(() => {
    const first = document.querySelector('skeleton-placeholder');
    const second = document.createElement('skeleton-placeholder');
    second.id = 'second';
    second.setAttribute('kind', 'text');
    second.setAttribute('lines', '2');
    first.after(second);
    first.setAttribute('radius', '32px');
  });
  await expect(page.locator('#second > span > span')).toHaveCount(2);
  await expect(page.locator('#second > span > span').first()).not.toHaveCSS('border-radius', '32px');
  await expect.poll(() => page.locator('#second > span').evaluate(element => {
    const [first, last] = element.children;
    return Math.round(last.getBoundingClientRect().width / first.getBoundingClientRect().width * 100);
  })).toBe(67);
  // 独立页主动重复调用入口，构建时将结果作为可观察状态输出。
  await page.goto('/standalone/');
  await expect(page.locator('html')).toHaveAttribute('data-sb2-ready', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-sb2-idempotent', 'true');
  await expect(page.locator('[data-sb2-resource="Tailwind"]')).toHaveCount(1);
  await expect(page.locator('[data-sb2-resource="Google Fonts"]')).toHaveCount(1);
  await expect(page.locator('[data-sb2-theme]')).toHaveCount(1);
});

test('首选 Tailwind CDN 失败时自动使用同版本备用源', async ({ page }) => {
  await page.route('https://unpkg.com/**', route => route.abort());
  await ready(page);
  await expect(page.locator('[data-sb2-resource-error]')).toHaveCount(0);
  await expect(page.locator('[data-sb2-resource="Tailwind"]')).toHaveCount(1);
  await expect(page.locator('[data-sb2-resource="Tailwind"]')).toHaveAttribute('src', 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.1.0/dist/index.global.js');
});

test('所有 CDN 失败可见，字体失败保留系统字体回退', async ({ page }) => {
  await page.route('https://unpkg.com/**', route => route.abort());
  await page.route('https://cdn.jsdelivr.net/**', route => route.abort());
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto('/standalone/');
  await expect(page.locator('[data-sb2-resource-error]')).toContainText('Tailwind 加载失败');
  await expect(page.locator('[data-sb2-resource-error]')).toContainText('Google Fonts 加载失败');
  await expect(page.locator('html')).toHaveAttribute('data-sb2-ready', 'false');
  await expect(page.locator('[data-sb2-demo]')).toBeAttached();
  expect(await page.locator('body').evaluate(element => getComputedStyle(element).fontFamily)).toContain('system-ui');
});

test('文字骨架随继承字号与 font-size 缩放，Logo/图片标识保留装饰语义', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    const root = document.createElement('div');
    root.id = 'type-check';
    root.style.fontSize = '12px';
    const text = document.createElement('skeleton-placeholder');
    text.setAttribute('kind', 'text');
    root.append(text);
    document.body.append(root);
  });
  const text = page.locator('#type-check [data-sb2-part="shape"]');
  await expect(text).toHaveCSS('height', '11.25px');
  await page.locator('#type-check').evaluate(element => { element.style.fontSize = '32px'; });
  await expect(text).toHaveCSS('height', '26.25px');
  await page.locator('#type-check skeleton-placeholder').evaluate(element => element.setAttribute('font-size', '18px'));
  await expect(text).toHaveCSS('height', '15.75px');
  const marker = page.locator('[data-region="media"] [data-sb2-marker="image"]');
  await expect(marker).toBeVisible();
  await expect(marker.locator('..').locator('..')).toHaveAttribute('aria-hidden', 'true');
  await page.goto('/iframe.html?id=foundations-skeleton--logo&viewMode=story');
  await expect(page.locator('[data-sb2-marker="logo"]')).toHaveText('LOGO');
  await expect(page.locator('[data-sb2-marker="logo"]')).toBeVisible();
});
