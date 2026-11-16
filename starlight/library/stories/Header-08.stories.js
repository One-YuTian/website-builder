import { createHeaderStory } from './header-story.js';
import description from '../components/header-08/README.md?raw';

export default { ...createHeaderStory('Header-08', 'header-08', description), title: 'Components/Header/Header-08', component: 'header-08', tags: ['autodocs'] };
export const Dark = { args: { theme: 'dark' } };
export const Light = { args: { theme: 'light' } };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };

