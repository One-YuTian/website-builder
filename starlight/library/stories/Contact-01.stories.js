import { createComponentStory } from './component-story.js';
import description from '../components/contact-01/README.md?raw';

export default { ...createComponentStory('contact-01', description, {}, {}), title: 'Pages/Contact/Contact-01', component: 'contact-01', tags: ['autodocs'] };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
