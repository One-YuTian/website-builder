import { createHeaderStory } from './header-story.js';
import description from '../components/header-05/README.md?raw';

export default { ...createHeaderStory('Header-05', 'header-05', description), title: 'Components/Header/Header-05', component: 'header-05', tags: ['autodocs'] };
export const Dark = { args: { theme: 'dark' } };
export const Light = { args: { theme: 'light' } };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };

