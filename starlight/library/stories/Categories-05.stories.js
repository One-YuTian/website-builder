import { createComponentStory } from './component-story.js';
import description from '../components/categories-05/README.md?raw';

export default {
  ...createComponentStory('categories-05', description, {}, {}),
  title: 'Blocks/Categories/Categories-05',
  component: 'categories-05',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
