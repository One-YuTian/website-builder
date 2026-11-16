import { createComponentStory } from './component-story.js';
import description from '../components/carousel-20/README.md?raw';

export default {
  ...createComponentStory('carousel-20', description, {}, {}),
  title: 'Blocks/Carousel/Carousel-20',
  component: 'carousel-20',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
