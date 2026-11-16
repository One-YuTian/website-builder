import { createComponentStory } from './component-story.js';
import description from '../components/about-03/README.md?raw';

export default { ...createComponentStory('about-03', description, {}, {}), title: 'Pages/About/About-03', component: 'about-03', tags: ['autodocs'] };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
