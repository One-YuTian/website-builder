import { createComponentStory } from './component-story.js';
import description from '../components/card-01/README.md?raw';

export default { ...createComponentStory('card-01', description, { productId: 'product-01', viewMode: 'grid', discounted: true }, { productId: { control: 'text' }, viewMode: { control: 'select', options: ['grid', 'list'] }, discounted: { control: 'boolean' } }), title: 'Components/Card/Card-01', component: 'card-01', tags: ['autodocs'] };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
