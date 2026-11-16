import { createComponentStory } from './component-story.js';
import description from '../components/home-03/README.md?raw';

export default {
  ...createComponentStory('home-03', description, {}, {}),
  title: 'Pages/Home/Home-03',
  component: 'home-03',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
