import { createComponentStory } from './component-story.js';
import description from '../components/home-12/README.md?raw';

export default {
  ...createComponentStory('home-12', description, {}, {}),
  title: 'Pages/Home/Home-12',
  component: 'home-12',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
