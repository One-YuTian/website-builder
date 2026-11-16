import { createHeaderStory } from './header-story.js';
import description from '../components/header-10/README.md?raw';

export default { ...createHeaderStory('Header-10', 'header-10', description), title: 'Components/Header/Header-10', component: 'header-10', tags: ['autodocs'] };
export const Dark = { args: { theme: 'dark' } };
export const Light = { args: { theme: 'light' } };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };

