import { createComponentStory } from './component-story.js';
import description from '../components/about-04/README.md?raw';

export default { ...createComponentStory('about-04', description, {}, {}), title: 'Pages/About/About-04', component: 'about-04', tags: ['autodocs'] };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
