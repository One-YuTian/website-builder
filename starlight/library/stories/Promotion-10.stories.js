import { createComponentStory } from './component-story.js';
import description from '../components/promotion-10/README.md?raw';

export default {
  ...createComponentStory('promotion-10', description, {}, {}),
  title: 'Blocks/Promotion/Promotion-10',
  component: 'promotion-10',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
