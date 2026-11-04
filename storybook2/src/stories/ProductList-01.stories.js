import { createComponentStory } from './component-story.js';
import description from '../components/productlist-01/README.md?raw';
import { demoProducts } from '../components/product-list/base.js';

export default { ...createComponentStory('productlist-01', description, { products: demoProducts() }, { products: { control: 'object', description: 'id、rating、discounted；按评分降序' } }), title: 'Blocks/ProductList/ProductList-01', component: 'productlist-01', tags: ['autodocs'] };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
