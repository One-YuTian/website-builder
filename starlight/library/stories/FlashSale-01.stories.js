import { createComponentStory } from './component-story.js';
import description from '../components/flashsale-01/README.md?raw';

export default {
  ...createComponentStory('flashsale-01', description, {}, {}),
  title: 'Blocks/FlashSale/FlashSale-01',
  component: 'flashsale-01',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
