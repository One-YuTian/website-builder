import { createComponentStory } from './component-story.js';
import description from '../components/shop-01/README.md?raw';

export default { ...createComponentStory('shop-01', description, {}, {}), title: 'Pages/Shop/Shop-01', component: 'shop-01', tags: ['autodocs'] };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };

