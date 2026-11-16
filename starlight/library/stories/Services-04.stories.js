import { createComponentStory } from './component-story.js';
import description from '../components/services-04/README.md?raw';

export default {
  ...createComponentStory('services-04', description, {}, {}),
  title: 'Blocks/Services/Services-04',
  component: 'services-04',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
