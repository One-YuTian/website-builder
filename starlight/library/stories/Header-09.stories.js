import { createHeaderStory } from './header-story.js';
import description from '../components/header-09/README.md?raw';

export default { ...createHeaderStory('Header-09', 'header-09', description), title: 'Components/Header/Header-09', component: 'header-09', tags: ['autodocs'] };
export const Dark = { args: { theme: 'dark' } };
export const Light = { args: { theme: 'light' } };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };

