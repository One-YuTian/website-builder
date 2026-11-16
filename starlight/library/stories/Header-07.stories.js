import { createHeaderStory } from './header-story.js';
import description from '../components/header-07/README.md?raw';

export default { ...createHeaderStory('Header-07', 'header-07', description), title: 'Components/Header/Header-07', component: 'header-07', tags: ['autodocs'] };
export const Dark = { args: { theme: 'dark' } };
export const Light = { args: { theme: 'light' } };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' } } };

