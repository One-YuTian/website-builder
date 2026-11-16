import { createComponentStory } from './component-story.js';
import description from '../components/home-04/README.md?raw';

export default {
  ...createComponentStory('home-04', description, {}, {}),
  title: 'Pages/Home/Home-04',
  component: 'home-04',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
