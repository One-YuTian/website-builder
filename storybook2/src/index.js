import { Skeleton } from './components/skeleton.js';
import { Header01 } from './components/header-01/index.js';
import { Header02 } from './components/header-02/index.js';
import { Footer01 } from './components/footer-01/index.js';
import { Footer02 } from './components/footer-02/index.js';
import { Card01 } from './components/card-01/index.js';
import { Carousel01 } from './components/carousel-01/index.js';
import { Carousel03 } from './components/carousel-03/index.js';
import { Carousel01Mobile } from './components/carousel-01/mobile.js';
import { Carousel03Mobile } from './components/carousel-03/mobile.js';
import { ProductList01 } from './components/productlist-01/index.js';
import { ProductList04 } from './components/productlist-04/index.js';
export { Header01 } from './components/header-01/index.js';
export { Header02 } from './components/header-02/index.js';
export { Footer01 } from './components/footer-01/index.js';
export { Footer02 } from './components/footer-02/index.js';
export { Card01 } from './components/card-01/index.js';
export { Carousel01 } from './components/carousel-01/index.js';
export { Carousel03 } from './components/carousel-03/index.js';
export { Carousel01Mobile } from './components/carousel-01/mobile.js';
export { Carousel03Mobile } from './components/carousel-03/mobile.js';
export { ProductList01 } from './components/productlist-01/index.js';
export { ProductList04 } from './components/productlist-04/index.js';
export { Skeleton, createSkeleton } from './components/skeleton.js';
export { initializeResources, loadJQuery } from './runtime/resources.js';
export { applyTheme } from './runtime/theme.js';
export { themeConfig, themePresets } from './config/theme.js';

export function registerComponents(registry = customElements) {
  for (const [tag, implementation] of [
    ['skeleton-placeholder', Skeleton],
    ['header-component', Header01],
    ['header-01', Header01],
    ['header-02', Header02],
    ['footer-component', Footer01],
    ['footer-01', Footer01],
    ['footer-02', Footer02],
    ['product-card', Card01],
    ['card-01', Card01],
    ['hero-carousel', Carousel01],
    ['carousel-01', Carousel01],
    ['carousel-03', Carousel03],
    ['carousel-01-mobile', Carousel01Mobile],
    ['carousel-03-mobile', Carousel03Mobile],
    ['product-list', ProductList01],
    ['productlist-01', ProductList01],
    ['productlist-04', ProductList04],
  ]) {
    const existing = registry.get(tag);
    if (existing && existing !== implementation) throw new Error(`Tag conflict: ${tag}`);
    if (!existing) registry.define(tag, implementation);
  }
}
