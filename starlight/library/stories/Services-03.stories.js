import { createComponentStory } from './component-story.js';
import description from '../components/services-03/README.md?raw';

export default {
  ...createComponentStory('services-03', description, {}, {}),
  title: 'Blocks/Services/Services-03',
  component: 'services-03',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
