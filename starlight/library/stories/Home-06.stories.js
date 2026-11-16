import { createComponentStory } from './component-story.js';
import description from '../components/home-06/README.md?raw';

export default {
  ...createComponentStory('home-06', description, {}, {}),
  title: 'Pages/Home/Home-06',
  component: 'home-06',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
