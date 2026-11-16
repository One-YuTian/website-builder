import { createComponentStory } from './component-story.js';
import description from '../components/promotion-11/README.md?raw';

export default {
  ...createComponentStory('promotion-11', description, {}, {}),
  title: 'Blocks/Promotion/Promotion-11',
  component: 'promotion-11',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
