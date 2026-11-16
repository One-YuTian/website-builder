import { createComponentStory } from './component-story.js';
import description from '../components/home-02/README.md?raw';

export default {
  ...createComponentStory('home-02', description, {}, {}),
  title: 'Pages/Home/Home-02',
  component: 'home-02',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
