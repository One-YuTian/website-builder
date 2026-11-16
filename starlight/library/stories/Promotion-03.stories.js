import { createComponentStory } from './component-story.js';
import description from '../components/promotion-03/README.md?raw';

export default {
  ...createComponentStory('promotion-03', description, {}, {}),
  title: 'Blocks/Promotion/Promotion-03',
  component: 'promotion-03',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
