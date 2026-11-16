import { createComponentStory } from './component-story.js';
import description from '../components/home-17/README.md?raw';

export default {
  ...createComponentStory('home-17', description, {}, {}),
  title: 'Pages/Home/Home-17',
  component: 'home-17',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
