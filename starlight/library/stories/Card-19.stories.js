import { createComponentStory } from './component-story.js';
import description from '../components/card-19/README.md?raw';

export default { ...createComponentStory('card-19', description, { productId: 'product-01', viewMode: 'grid', discounted: true }, { productId: { control: 'text' }, viewMode: { control: 'select', options: ['grid', 'list'] }, discounted: { control: 'boolean' } }), title: 'Components/Card/Card-19', component: 'card-19', tags: ['autodocs'] };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };

