import { createComponentStory } from './component-story.js';
import description from '../components/carousel-30/README.md?raw';

export default {
  ...createComponentStory('carousel-30', description, {}, {}),
  title: 'Blocks/Carousel/Carousel-30',
  component: 'carousel-30',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
