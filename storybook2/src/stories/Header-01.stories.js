import { createHeaderStory } from './header-story.js';
import description from '../components/header-01/README.md?raw';

export default { ...createHeaderStory('Header-01', 'header-01', description), title: 'Components/Header/Header-01', component: 'header-01', tags: ['autodocs'] };
export const Dark = { args: { theme: 'dark' } };
export const Light = { args: { theme: 'light' } };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };
