import { createComponentStory } from './component-story.js';
import description from '../components/home-11/README.md?raw';

export default {
  ...createComponentStory('home-11', description, {}, {}),
  title: 'Pages/Home/Home-11',
  component: 'home-11',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
