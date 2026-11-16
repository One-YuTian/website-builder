import { createComponentStory } from './component-story.js';
import description from '../components/categories-06/README.md?raw';

export default {
  ...createComponentStory('categories-06', description, {}, {}),
  title: 'Blocks/Categories/Categories-06',
  component: 'categories-06',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
