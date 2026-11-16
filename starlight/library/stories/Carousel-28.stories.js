import { createComponentStory } from './component-story.js';
import description from '../components/carousel-28/README.md?raw';

export default {
  ...createComponentStory('carousel-28', description, {}, {}),
  title: 'Blocks/Carousel/Carousel-28',
  component: 'carousel-28',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
