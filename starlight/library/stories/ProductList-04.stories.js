import { createComponentStory } from './component-story.js';
import description from '../components/productlist-04/README.md?raw';
import { demoProducts } from '../components/product-list/base.js';

export default { ...createComponentStory('productlist-04', description, { products: demoProducts() }, { products: { control: 'object', description: 'id、rating、discounted；按评分降序' } }), title: 'Blocks/ProductList/ProductList-04', component: 'productlist-04', tags: ['autodocs'] };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
