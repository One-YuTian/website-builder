import { createComponentStory } from './component-story.js';
import description from '../components/home-05/README.md?raw';

export default {
  ...createComponentStory('home-05', description, {}, {}),
  title: 'Pages/Home/Home-05',
  component: 'home-05',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
