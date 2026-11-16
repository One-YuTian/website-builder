import { createComponentStory } from './component-story.js';
import description from '../components/home-21/README.md?raw';

export default {
  ...createComponentStory('home-21', description, {}, {}),
  title: 'Pages/Home/Home-21',
  component: 'home-21',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
