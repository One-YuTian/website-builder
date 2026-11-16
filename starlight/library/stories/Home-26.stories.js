import { createComponentStory } from './component-story.js';
import description from '../components/home-26/README.md?raw';

export default {
  ...createComponentStory('home-26', description, {}, {}),
  title: 'Pages/Home/Home-26',
  component: 'home-26',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
