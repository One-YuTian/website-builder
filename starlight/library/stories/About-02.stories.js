import { createComponentStory } from './component-story.js';
import description from '../components/about-02/README.md?raw';

export default { ...createComponentStory('about-02', description, {}, {}), title: 'Pages/About/About-02', component: 'about-02', tags: ['autodocs'] };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
