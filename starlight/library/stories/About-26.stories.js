import { createComponentStory } from './component-story.js';
import description from '../components/about-26/README.md?raw';

export default { ...createComponentStory('about-26', description, {}, {}), title: 'Pages/About/About-26', component: 'about-26', tags: ['autodocs'] };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
