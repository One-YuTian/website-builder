import { test, expect } from '@playwright/test';

const components = [
  ['footer-01', 'components-footer-footer-01'], ['footer-02', 'components-footer-footer-02'],
  ['card-01', 'components-card-card-01'], ['carousel-01', 'blocks-carousel-carousel-01'],
  ['carousel-03', 'blocks-carousel-carousel-03'], ['productlist-01', 'blocks-productlist-productlist-01'],
  ['productlist-04', 'blocks-productlist-productlist-04'],
];
async function open(page, tag, width = 1440) {
  const prefix = components.find(entry => entry[0] === tag)[1];
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`/iframe.html?id=${prefix}--${width < 640 ? 'mobile' : width < 1024 ? 'tablet' : 'pc'}&viewMode=story`);
  await page.locator(tag).waitFor({ state: 'attached' });
  return page.locator(tag);
}

for (const width of [1440, 768, 390]) {
  test(`新增七个组件及板块 ${width}px 显示规则、骨架与无溢出`, async ({ page }) => {
    for (const [tag] of components) {
      const component = await open(page, tag, width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), tag).toBe(true);
      await expect(component.locator('img,picture,svg,iframe,[aria-busy]')).toHaveCount(0);
      if (tag.startsWith('carousel') && width < 1024) {
        await expect(component).toBeHidden();
        await expect(page.locator(`${tag}-mobile`)).toBeVisible();
        continue;
      }
      await expect(component).toBeVisible();
      const visible = (await component.innerText()).replaceAll('LOGO', '').trim();
      expect(visible, tag).toBe('');
      if (tag.startsWith('footer')) {
        await expect(component.locator('[data-sb2-marker="logo"]')).toBeVisible();
        const columns = await component.locator('[data-region="footer-columns"]').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
        expect(columns).toBe(width >= 768 ? 3 : 1);
        if (tag === 'footer-02') {
          if (width < 768) { await expect(component.locator('[data-region="mobile-policy"]')).toBeVisible(); await expect(component.locator('[data-region="bottom-policy"]')).toBeHidden(); }
          else { await expect(component.locator('[data-region="mobile-policy"]')).toBeHidden(); await expect(component.locator('[data-region="bottom-policy"]')).toBeVisible(); }
        }
      }
      if (tag.startsWith('productlist')) {
        await expect(component.locator('card-01')).toHaveCount(width >= 1024 ? 10 : width >= 768 ? 8 : 6);
        expect(await component.locator('[data-region="product-grid"]').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(width >= 1024 ? 5 : width >= 768 ? 4 : 2);
      }
      if (tag === 'carousel-03') {
        await expect(component.locator('[data-region="side-image"]')).toHaveCount(2);
        await expect(component.getByRole('link')).toHaveCount(6);
        await expect(component.locator('[data-region="side-image"] [data-sb2-part="shape"]').first()).toHaveCSS('height', '121px');
      }
      if (tag.startsWith('carousel')) await expect(component.locator('[data-slide]:not([hidden]) [data-sb2-part="shape"]')).toHaveCSS('height', tag === 'carousel-01' ? '550px' : '250px');
    }
  });
}

test('两个Footer导航保持独立，移除重连不重复触发', async ({ page }) => {
  for (const tag of ['footer-01', 'footer-02']) {
    const component = await open(page, tag);
    await component.evaluate(element => {
      window.footerEvents = [];
      element.addEventListener('footer-navigate', event => window.footerEvents.push(event.detail));
      const parent = element.parentElement; element.remove(); parent.append(element);
    });
    await component.getByRole('link', { name: '隐私政策', exact: true }).focus();
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => window.footerEvents)).toEqual([{ destination: 'privacy' }]);
    expect(new URL(page.url()).hash).toBe('');
  }
});

test('Card-01 图片与标题导航、折扣切换、窄屏列表模式', async ({ page }) => {
  const card = await open(page, 'card-01', 390);
  await card.evaluate(element => { window.productEvents = []; element.addEventListener('product-navigate', event => window.productEvents.push(event.detail)); });
  await card.getByRole('button', { name: '查看商品图片' }).click();
  await card.evaluate(element => { element.viewMode = 'list'; element.productId = 'new-product'; element.discounted = false; });
  await expect(card.locator('[data-region="description"]')).toBeVisible();
  await expect(card.locator('[data-region="discount"]')).toHaveCount(0);
  await expect(card.locator('[data-region="original-price"]')).toHaveCount(0);
  await card.getByRole('button', { name: '查看商品详情' }).focus();
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => window.productEvents)).toEqual([{ productId: 'product-01' }, { productId: 'new-product' }]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const tag of ['productlist-01', 'productlist-04']) {
  test(`${tag} 评分排序、sm展示数量、事件及数据隔离`, async ({ page }) => {
    const list = await open(page, tag, 640);
    await expect(list.locator('card-01')).toHaveCount(9);
    await list.evaluate(element => {
      element.products = [{ id: 'low', rating: 1 }, { id: 'high', rating: 5, discounted: true }, { id: 'middle', rating: 3 }];
      const copy = element.products; copy[0].id = 'mutated';
      window.productEvents = []; element.addEventListener('product-navigate', event => window.productEvents.push(event.detail));
    });
    expect(await list.locator('card-01').evaluateAll(elements => elements.map(element => element.productId))).toEqual(['high', 'middle', 'low']);
    await list.locator('card-01').first().getByRole('button', { name: '查看商品详情' }).click();
    expect(await page.evaluate(() => window.productEvents)).toEqual([{ productId: 'high' }]);
    await list.evaluate(element => { element.products = []; });
    await expect(list.locator('card-01')).toHaveCount(0);
  });
}

for (const tag of ['carousel-01', 'carousel-03']) {
  test(`${tag} 分页、键盘、滑动、暂停及隐藏后停播`, async ({ page }) => {
    const carousel = await open(page, tag);
    await carousel.evaluate(element => { element.paused = true; window.carouselEvents = []; element.addEventListener('carousel-change', event => window.carouselEvents.push(event.detail)); });
    await carousel.getByRole('button', { name: '切换到第2张' }).click();
    await expect(carousel).toHaveAttribute('data-active-index', '1');
    await carousel.getByRole('region', { name: '图片轮播', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(carousel).toHaveAttribute('data-active-index', '0');
    const stage = carousel.locator('[data-region="carousel-stage"]');
    await stage.dispatchEvent('pointerdown', { clientX: 200, clientY: 100 });
    await stage.dispatchEvent('pointerup', { clientX: 80, clientY: 105 });
    await expect(carousel).toHaveAttribute('data-active-index', '1');
    await carousel.getByRole('button', { name: '继续轮播' }).click();
    await carousel.evaluate(element => { element.interval = 500; document.activeElement.blur(); });
    await page.mouse.move(1400, 850);
    await expect.poll(() => page.evaluate(() => window.carouselEvents.length)).toBeGreaterThan(3);
    await page.setViewportSize({ width: 768, height: 900 });
    await expect(carousel).toBeHidden();
    const initial = await page.evaluate(() => window.carouselEvents.length);
    await page.waitForTimeout(650);
    expect(await page.evaluate(() => window.carouselEvents.length)).toBe(initial);
  });
}

test('Carousel-03分类导航、重连清理与多实例索引隔离', async ({ page }) => {
  const carousel = await open(page, 'carousel-03');
  await carousel.evaluate(element => {
    element.paused = true;
    window.categoryEvents = [];
    element.addEventListener('carousel-navigate', event => window.categoryEvents.push(event.detail));
    const parent = element.parentElement; element.remove(); parent.append(element);
    const sibling = document.createElement('carousel-01'); sibling.paused = true; parent.append(sibling);
  });
  await carousel.getByRole('link', { name: '查看分类 2', exact: true }).click();
  expect(await page.evaluate(() => window.categoryEvents)).toEqual([{ categoryId: 'category-02' }]);
  await carousel.getByRole('button', { name: '切换到第2张' }).click();
  await expect(page.locator('carousel-01')).toHaveAttribute('data-active-index', '0');
});

test('七个新增条目提供Doc/PC/Tablet/Mobile及完整组合代码', async ({ page, request }) => {
  const { entries } = await (await request.get('/index.json')).json();
  for (const [tag, prefix] of components) for (const kind of ['doc', 'pc', 'tablet', 'mobile']) expect(entries[`${prefix}--${kind}`], `${tag}/${kind}`).toBeTruthy();
  await page.goto('/?path=/docs/blocks-carousel-carousel-03--doc');
  const frame = page.frameLocator('#storybook-preview-iframe');
  await expect(frame.getByRole('heading', { name: '区域对应表', exact: true })).toBeVisible();
  await expect(frame.getByRole('heading', { name: 'PC 完整组合代码', exact: true })).toBeVisible();
  await expect(frame.getByRole('heading', { name: 'Paid / Mobile 独立适配代码', exact: true })).toBeVisible();
  await expect(frame.getByRole('heading', { name: '来源与重写' })).toHaveCount(0);
});

test('七个新增条目的独立入口均已收录，页面只呈现选中的组件', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [tag] of components) {
    await page.goto(`/standalone/?component=${tag}`);
    await expect(page.locator('html')).toHaveAttribute('data-sb2-ready', 'true');
    await expect(page.locator(`#component-preview ${tag}`)).toBeVisible();
    await expect(page.locator('main')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), tag).toBe(true);
  }
});

test('普通script注册全部新标签并共享全局颜色与字体偏移', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('/examples/header-01.html');
  expect(await page.evaluate(async () => (await ComponentLibrary.ready).ready)).toBe(true);
  const registered = await page.evaluate(tags => {
    ComponentLibrary.applyTheme({ preset: 'ocean', contentMaxWidth: 1120 });
    for (const tag of tags) {
      const element = document.createElement(tag);
      if ('paused' in element) element.paused = true;
      if ('discounted' in element) element.discounted = true;
      element.dataset.integration = tag;
      document.body.append(element);
    }
    return tags.every(tag => Boolean(customElements.get(tag)));
  }, components.map(entry => entry[0]));
  expect(registered).toBe(true);
  await expect(page.locator('footer-01 footer')).toHaveCSS('background-color', 'rgb(23, 37, 84)');
  await expect(page.locator('footer-02 footer')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('card-01[data-integration] [data-region="discount"]')).toHaveCSS('background-color', 'rgb(37, 99, 235)');
  await expect(page.locator('productlist-04 [data-region="product-image"] [data-sb2-part="shape"]').first()).toHaveCSS('background-color', 'rgb(219, 234, 254)');
  await expect(page.locator('card-01[data-integration] [data-region="product-title"] [data-sb2-part="shape"]').first()).toHaveCSS('height', '12.75px');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--theme-skeleton-text-offset').trim())).toBe('3px');
});
