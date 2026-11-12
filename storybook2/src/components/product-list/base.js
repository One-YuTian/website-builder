import { ViewElement, placeholder } from '../shared/markup.js';
import { themeConfig } from '../../config/theme.js';

export const demoProducts = () => Array.from({ length: 10 }, (_, index) => ({ id: `product-${String(index + 1).padStart(2, '0')}`, rating: 5 - index / 10, discounted: index % 2 === 0 }));

export class ProductListBase extends ViewElement {
  constructor() { super(); this._products = demoProducts(); }
  get products() { return this._products.map(product => ({ ...product })); }
  set products(value) {
    this._products = Array.isArray(value) ? value.filter(item => item && typeof item.id === 'string' && item.id.trim()).map(item => ({ id: item.id, rating: Number.isFinite(item.rating) ? item.rating : 0, discounted: Boolean(item.discounted) })) : [];
    if (this.isConnected) this.render();
  }
  visibleLimit() {
    const view = this.ownerDocument.defaultView;
    const matches = key => view.matchMedia(`(min-width: ${themeConfig.breakpoints[key] / 16}rem)`).matches;
    return matches('lg') ? 10 : matches('md') ? 8 : matches('sm') ? 9 : 6;
  }
  render() {
    this.innerHTML = `<section class="bg-accent/20 py-5 pb-8 font-sans text-content"><div class="w-full max-w-content mx-auto px-4 lg:px-6"><div data-region="section-title" class="mb-5 text-xl md:text-2xl">${placeholder('title', '200px', '', 'heading')}</div><div data-region="product-grid" class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5"></div></div></section>`;
    const grid = this.querySelector('[data-region="product-grid"]');
    [...this._products].sort((a, b) => b.rating - a.rating).slice(0, this.visibleLimit()).forEach(product => {
      const card = this.ownerDocument.createElement('card-01');
      card.productId = product.id;
      card.discounted = product.discounted;
      grid.append(card);
    });
  }
  bind(signal) {
    for (const key of ['sm', 'md', 'lg']) this.ownerDocument.defaultView.matchMedia(`(min-width: ${themeConfig.breakpoints[key] / 16}rem)`).addEventListener('change', () => this.render(), { signal });
  }
}
