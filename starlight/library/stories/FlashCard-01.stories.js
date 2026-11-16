import { createComponentStory } from './component-story.js';
import description from '../components/flashcard-01/README.md?raw';

export default {
  ...createComponentStory('flashcard-01', description, {}, {}),
  title: 'Components/FlashCard/FlashCard-01',
  component: 'flashcard-01',
  tags: ['autodocs']
};
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
