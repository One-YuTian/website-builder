import { createComponentStory } from './component-story.js';
import description from '../components/flashsale-03/README.md?raw';

export default {
  ...createComponentStory('flashsale-03', description, {}, {}),
  title: 'Blocks/FlashSale/FlashSale-03',
  component: 'flashsale-03',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
