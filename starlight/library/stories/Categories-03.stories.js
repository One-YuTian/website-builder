import { createComponentStory } from './component-story.js';
import description from '../components/categories-03/README.md?raw';

export default {
  ...createComponentStory('categories-03', description, {}, {}),
  title: 'Blocks/Categories/Categories-03',
  component: 'categories-03',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
