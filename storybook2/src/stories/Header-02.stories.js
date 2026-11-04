import { createHeaderStory } from './header-story.js';
import description from '../components/header-02/README.md?raw';

export default {
  ...createHeaderStory('Header-02', 'header-02', description),
  title: 'Components/Header/Header-02',
  component: 'header-02',
  tags: ['autodocs'],
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
