import { createComponentStory } from './component-story.js';
import description from '../components/carousel-14/README.md?raw';

export default {
  ...createComponentStory('carousel-14', description, {}, {}),
  title: 'Blocks/Carousel/Carousel-14',
  component: 'carousel-14',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
