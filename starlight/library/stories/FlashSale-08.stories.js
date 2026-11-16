import { createComponentStory } from './component-story.js';
import description from '../components/flashsale-08/README.md?raw';

export default {
  ...createComponentStory('flashsale-08', description, {}, {}),
  title: 'Blocks/FlashSale/FlashSale-08',
  component: 'flashsale-08',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
