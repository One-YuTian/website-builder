import { createComponentStory } from './component-story.js';
import description from '../components/home-16/README.md?raw';

export default {
  ...createComponentStory('home-16', description, {}, {}),
  title: 'Pages/Home/Home-16',
  component: 'home-16',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
