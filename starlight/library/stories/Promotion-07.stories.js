import { createComponentStory } from './component-story.js';
import description from '../components/promotion-07/README.md?raw';

export default {
  ...createComponentStory('promotion-07', description, {}, {}),
  title: 'Blocks/Promotion/Promotion-07',
  component: 'promotion-07',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
