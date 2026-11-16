import { createComponentStory } from './component-story.js';
import description from '../components/home-01/README.md?raw';

export default {
  ...createComponentStory('home-01', description, {}, {}),
  title: 'Pages/Home/Home-01',
  component: 'home-01',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };

