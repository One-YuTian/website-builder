import { createComponentStory } from './component-story.js';
import description from '../components/about-15/README.md?raw';

export default { ...createComponentStory('about-15', description, {}, {}), title: 'Pages/About/About-15', component: 'about-15', tags: ['autodocs'] };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
