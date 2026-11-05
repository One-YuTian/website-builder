import { catalog } from '../catalog.js';

export const defaults = {
  'header-01': { isLoggedIn: false, cartCount: 3, wishlistCount: 2, theme: 'dark' },
  'header-02': { isLoggedIn: false, cartCount: 3, wishlistCount: 2, theme: 'dark' },
  'header-03': { isLoggedIn: false, cartCount: 3, wishlistCount: 2, theme: 'dark' },
  'header-04': { isLoggedIn: false, cartCount: 3, wishlistCount: 2, theme: 'dark' },
  'header-05': { isLoggedIn: false, cartCount: 3, wishlistCount: 2, theme: 'light' },
  'header-06': { isLoggedIn: false, cartCount: 3, wishlistCount: 2, theme: 'dark' },
  'header-07': { isLoggedIn: false, cartCount: 3, wishlistCount: 2, theme: 'dark' },
  'header-08': { isLoggedIn: false, cartCount: 3, wishlistCount: 2, theme: 'dark' },
  'header-09': { isLoggedIn: false, cartCount: 3, wishlistCount: 2, theme: 'dark' },
  'header-10': { isLoggedIn: false, cartCount: 3, wishlistCount: 2, theme: 'dark' },
  'footer-01': {}, 'footer-02': {},
  'card-01': { productId: 'product-01', viewMode: 'grid', discounted: true },
  'card-02': { productId: 'product-01', viewMode: 'grid', discounted: true },
  'card-07': { productId: 'product-01', viewMode: 'grid', discounted: true },
  'card-11': { productId: 'product-01', viewMode: 'grid', discounted: true },
  'card-19': { productId: 'product-01', viewMode: 'grid', discounted: true },
  'card-23': { productId: 'product-01', viewMode: 'grid', discounted: true },
  'carousel-01': { paused: false, interval: 2500, activeIndex: 0 },
  'carousel-03': { paused: false, interval: 2500, activeIndex: 0 },
  'productlist-01': {}, 'productlist-02': {}, 'productlist-03': {}, 'productlist-04': {},
  'shop-01': {}, 'shop-02': {}, 'shop-04': {}, 'shop-12': {},
  'detail-01': {}, 'detail-04': {},
};
export function validateProps(id, value) {
  if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error('属性需要是 JSON 对象');
  const schema = id.startsWith('header-') ? { isLoggedIn: 'boolean', cartCount: 'number', wishlistCount: 'number', searchSuggestions: 'array', theme: 'string' }
    : id.startsWith('card-') ? { productId: 'string', viewMode: 'string', discounted: 'boolean' }
    : id.startsWith('carousel-') ? { paused: 'boolean', interval: 'number', activeIndex: 'number', slides: 'array', categories: 'array' }
    : id.startsWith('productlist-') ? { products: 'array' }
    : id.startsWith('shop-') ? { sortOrder: 'string' }
    : id.startsWith('detail-') ? {} : {};
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (!Object.hasOwn(schema, key)) throw new Error(`不支持的属性：${key}`);
    if (schema[key] === 'array' ? !Array.isArray(item) : typeof item !== schema[key]) throw new Error(`属性类型不正确：${key}`);
    if (typeof item === 'number' && !Number.isFinite(item)) throw new Error(`属性必须是有限数字：${key}`);
    result[key] = item;
  }
  if (result.theme && !['dark', 'light'].includes(result.theme)) throw new Error('theme 只能是 dark 或 light');
  if (result.viewMode && !['grid', 'list'].includes(result.viewMode)) throw new Error('viewMode 只能是 grid 或 list');
  return result;
}
export function normalizeState(value) {
  const clamp = (number, fallback) => Number.isFinite(Number(number)) ? Math.max(320, Math.min(2560, Math.round(Number(number)))) : fallback;
  const usedKeys = new Set();
  const items = Array.isArray(value?.items) ? value.items.slice(0, 50).flatMap((item, index) => {
    if (!catalog.some(entry => entry.id === item.id)) return [];
    try {
      let key = typeof item.key === 'string' && /^[a-z][a-z0-9-]{0,40}$/.test(item.key) ? item.key : `item-${index + 1}`;
      while (usedKeys.has(key)) key += '-x';
      usedKeys.add(key);
      return [{ key, id: item.id, props: validateProps(item.id, item.props || {}) }];
    } catch { return []; }
  }) : [];
  return { items, viewportWidth: clamp(value?.viewportWidth, 1440), contentWidth: clamp(value?.contentWidth, 1200), preset: ['default', 'ocean', 'forest'].includes(value?.preset) ? value.preset : 'default' };
}
