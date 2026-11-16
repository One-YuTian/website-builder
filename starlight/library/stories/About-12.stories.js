import { createComponentStory } from './component-story.js';
import description from '../components/about-12/README.md?raw';

export default { ...createComponentStory('about-12', description, {}, {}), title: 'Pages/About/About-12', component: 'about-12', tags: ['autodocs'] };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
