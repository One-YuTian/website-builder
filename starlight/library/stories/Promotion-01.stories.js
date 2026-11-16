import { createComponentStory } from './component-story.js';
import description from '../components/promotion-01/README.md?raw';

export default {
  ...createComponentStory('promotion-01', description, {}, {}),
  title: 'Blocks/Promotion/Promotion-01',
  component: 'promotion-01',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
