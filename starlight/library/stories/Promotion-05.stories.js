import { createComponentStory } from './component-story.js';
import description from '../components/promotion-05/README.md?raw';

export default {
  ...createComponentStory('promotion-05', description, {}, {}),
  title: 'Blocks/Promotion/Promotion-05',
  component: 'promotion-05',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
