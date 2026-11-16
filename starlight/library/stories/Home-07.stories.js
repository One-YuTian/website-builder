import { createComponentStory } from './component-story.js';
import description from '../components/home-07/README.md?raw';

export default {
  ...createComponentStory('home-07', description, {}, {}),
  title: 'Pages/Home/Home-07',
  component: 'home-07',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
