import { createComponentStory } from './component-story.js';
import description from '../components/home-23/README.md?raw';

export default {
  ...createComponentStory('home-23', description, {}, {}),
  title: 'Pages/Home/Home-23',
  component: 'home-23',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
