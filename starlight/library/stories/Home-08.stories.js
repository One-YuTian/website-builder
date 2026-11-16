import { createComponentStory } from './component-story.js';
import description from '../components/home-08/README.md?raw';

export default {
  ...createComponentStory('home-08', description, {}, {}),
  title: 'Pages/Home/Home-08',
  component: 'home-08',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
