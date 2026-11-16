import { createComponentStory } from './component-story.js';
import description from '../components/home-20/README.md?raw';

export default {
  ...createComponentStory('home-20', description, {}, {}),
  title: 'Pages/Home/Home-20',
  component: 'home-20',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
