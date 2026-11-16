import { createComponentStory } from './component-story.js';
import description from '../components/home-09/README.md?raw';

export default {
  ...createComponentStory('home-09', description, {}, {}),
  title: 'Pages/Home/Home-09',
  component: 'home-09',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
