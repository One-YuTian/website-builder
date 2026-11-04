import { createComponentStory } from './component-story.js';
import description from '../components/footer-01/README.md?raw';

export default { ...createComponentStory('footer-01', description, {}, {}), title: 'Components/Footer/Footer-01', component: 'footer-01', tags: ['autodocs'] };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
