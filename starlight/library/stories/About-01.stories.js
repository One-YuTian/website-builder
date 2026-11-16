import { createComponentStory } from './component-story.js';
import description from '../components/about-01/README.md?raw';

export default { ...createComponentStory('about-01', description, {}, {}), title: 'Pages/About/About-01', component: 'about-01', tags: ['autodocs'] };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
