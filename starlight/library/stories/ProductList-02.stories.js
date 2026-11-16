import { createComponentStory } from './component-story.js';
import description from '../components/productlist-02/README.md?raw';
import { demoProducts } from '../components/product-list/base.js';

export default { ...createComponentStory('productlist-02', description, { products: demoProducts() }, { products: { control: 'object', description: 'id, rating, discounted' } }), title: 'Blocks/ProductList/ProductList-02', component: 'productlist-02', tags: ['autodocs'] };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
