import { createComponentStory } from './component-story.js';
import description from '../components/about-21/README.md?raw';

export default { ...createComponentStory('about-21', description, {}, {}), title: 'Pages/About/About-21', component: 'about-21', tags: ['autodocs'] };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
