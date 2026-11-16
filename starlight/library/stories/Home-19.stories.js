import { createComponentStory } from './component-story.js';
import description from '../components/home-19/README.md?raw';

export default {
  ...createComponentStory('home-19', description, {}, {}),
  title: 'Pages/Home/Home-19',
  component: 'home-19',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
