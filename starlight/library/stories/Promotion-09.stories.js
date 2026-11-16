import { createComponentStory } from './component-story.js';
import description from '../components/promotion-09/README.md?raw';

export default {
  ...createComponentStory('promotion-09', description, {}, {}),
  title: 'Blocks/Promotion/Promotion-09',
  component: 'promotion-09',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
