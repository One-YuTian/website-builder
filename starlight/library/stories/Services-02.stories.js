import { createComponentStory } from './component-story.js';
import description from '../components/services-02/README.md?raw';

export default {
  ...createComponentStory('services-02', description, {}, {}),
  title: 'Blocks/Services/Services-02',
  component: 'services-02',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
