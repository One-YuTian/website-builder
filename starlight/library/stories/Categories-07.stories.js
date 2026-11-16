import { createComponentStory } from './component-story.js';
import description from '../components/categories-07/README.md?raw';

export default {
  ...createComponentStory('categories-07', description, {}, {}),
  title: 'Blocks/Categories/Categories-07',
  component: 'categories-07',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
