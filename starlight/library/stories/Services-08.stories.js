import { createComponentStory } from './component-story.js';
import description from '../components/services-08/README.md?raw';

export default {
  ...createComponentStory('services-08', description, {}, {}),
  title: 'Blocks/Services/Services-08',
  component: 'services-08',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
