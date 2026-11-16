import { createComponentStory } from './component-story.js';
import description from '../components/promotion-02/README.md?raw';

export default {
  ...createComponentStory('promotion-02', description, {}, {}),
  title: 'Blocks/Promotion/Promotion-02',
  component: 'promotion-02',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
