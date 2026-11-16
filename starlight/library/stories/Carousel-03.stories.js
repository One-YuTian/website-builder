import { createComponentStory } from './component-story.js';
import description from '../components/carousel-03/README.md?raw';
import { sourceCode } from './code-docs.js';

export default { ...createComponentStory('carousel-03', description, { paused: false, interval: 2500, activeIndex: 0 }, { paused: { control: 'boolean' }, interval: { control: { type: 'number', min: 500 } }, activeIndex: { control: { type: 'number', min: 0 } } }), title: 'Blocks/Carousel/Carousel-03', component: 'carousel-03', tags: ['autodocs'] };
export const PC = { parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { parameters: { viewport: { defaultViewport: 'tablet' }, docs: { source: { code: sourceCode('carousel-03', 'mobile'), language: 'html' } } } };
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile' }, docs: { source: { code: sourceCode('carousel-03', 'mobile'), language: 'html' } } } };
