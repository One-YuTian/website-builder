import { createComponentStory } from './component-story.js';
import description from '../components/home-13/README.md?raw';

export default {
  ...createComponentStory('home-13', description, {}, {}),
  title: 'Pages/Home/Home-13',
  component: 'home-13',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
