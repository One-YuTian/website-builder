import { createComponentStory } from './component-story.js';
import description from '../components/home-22/README.md?raw';

export default {
  ...createComponentStory('home-22', description, {}, {}),
  title: 'Pages/Home/Home-22',
  component: 'home-22',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
