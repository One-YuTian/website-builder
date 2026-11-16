import { createComponentStory } from './component-story.js';
import description from '../components/about-10/README.md?raw';

export default { ...createComponentStory('about-10', description, {}, {}), title: 'Pages/About/About-10', component: 'about-10', tags: ['autodocs'] };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
