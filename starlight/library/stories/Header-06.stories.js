import { createHeaderStory } from './header-story.js';
import description from '../components/header-06/README.md?raw';

export default { ...createHeaderStory('Header-06', 'header-06', description), title: 'Components/Header/Header-06', component: 'header-06', tags: ['autodocs'] };
export const Dark = { args: { theme: 'dark' } };
export const Light = { args: { theme: 'light' } };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };

