import { createComponentStory } from './component-story.js';
import description from '../components/flashsale-07/README.md?raw';

export default {
  ...createComponentStory('flashsale-07', description, {}, {}),
  title: 'Blocks/FlashSale/FlashSale-07',
  component: 'flashsale-07',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
