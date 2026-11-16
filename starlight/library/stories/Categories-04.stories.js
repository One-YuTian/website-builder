import { createComponentStory } from './component-story.js';
import description from '../components/categories-04/README.md?raw';

export default {
  ...createComponentStory('categories-04', description, {}, {}),
  title: 'Blocks/Categories/Categories-04',
  component: 'categories-04',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
