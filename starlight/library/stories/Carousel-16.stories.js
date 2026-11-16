import { createComponentStory } from './component-story.js';
import description from '../components/carousel-16/README.md?raw';

export default {
  ...createComponentStory('carousel-16', description, {}, {}),
  title: 'Blocks/Carousel/Carousel-16',
  component: 'carousel-16',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
