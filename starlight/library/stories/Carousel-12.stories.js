import { createComponentStory } from './component-story.js';
import description from '../components/carousel-12/README.md?raw';

export default {
  ...createComponentStory('carousel-12', description, {}, {}),
  title: 'Blocks/Carousel/Carousel-12',
  component: 'carousel-12',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
