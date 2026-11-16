import { createComponentStory } from './component-story.js';
import description from '../components/toast-01/README.md?raw';

export default {
  ...createComponentStory('toast-01', description, {}, {}),
  title: 'Components/Toast/Toast-01',
  component: 'toast-01',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };

