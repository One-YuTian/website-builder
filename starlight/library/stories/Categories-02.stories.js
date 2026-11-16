import { createComponentStory } from './component-story.js';
import description from '../components/categories-02/README.md?raw';

export default {
  ...createComponentStory('categories-02', description, {}, {}),
  title: 'Blocks/Categories/Categories-02',
  component: 'categories-02',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
