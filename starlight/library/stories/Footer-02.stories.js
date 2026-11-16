import { createComponentStory } from './component-story.js';
import description from '../components/footer-02/README.md?raw';

export default { ...createComponentStory('footer-02', description, {}, {}), title: 'Components/Footer/Footer-02', component: 'footer-02', tags: ['autodocs'] };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
