import { createComponentStory } from './component-story.js';
import description from '../components/services-05/README.md?raw';

export default {
  ...createComponentStory('services-05', description, {}, {}),
  title: 'Blocks/Services/Services-05',
  component: 'services-05',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
