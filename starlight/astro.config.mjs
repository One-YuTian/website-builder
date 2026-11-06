import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLlmsTxt from 'starlight-llms-txt';
import { catalog } from '../storybook2/src/catalog.js';

// Build customSets for starlight-llms-txt so each component gets an individual LLM route
const componentCustomSets = catalog.map((c) => {
  const level1 = (c.group || 'Components').toLowerCase();
  const level2 = (c.kind || c.name.split('-')[0]).toLowerCase();
  const routePath = `${level1}/${level2}/${c.id}`;
  return {
    label: `${c.group} / ${c.kind} / ${c.name}`,
    paths: [routePath],
    description: `${c.name} standalone Native Web Component API, observed attributes, and source code.`
  };
});

// Provide optional direct clean links to the dedicated .txt docs
const dedicatedOptionalLinks = catalog.map((c) => {
  const level1 = (c.group || 'Components').toLowerCase();
  const level2 = (c.kind || c.name.split('-')[0]).toLowerCase();
  return {
    label: `Clean LLM Raw: ${c.group} > ${c.kind} > ${c.name}`,
    url: `/llms/${level1}/${level2}/${c.id}.txt`,
    description: `Pure isolated prompt context for ${c.name} without UI wrapper artifacts.`
  };
});

export default defineConfig({
  site: 'https://storybook2.internal',
  integrations: [
    starlight({
      title: 'Storybook2 Docs',
      defaultLocale: 'root',
      tableOfContents: false,
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
      },
      plugins: [
        starlightLlmsTxt({
          projectName: 'Storybook2 Web Components & Blocks',
          description: 'Production-ready Native Web Components, Tailwind CSS, and Light DOM templates.',
          details: 'Hierarchy is structured across Groups (Components / Blocks / Pages), Kinds (Header, Footer, Card, Carousel, ProductList, Shop, Detail, About, Contact), and Individual Components. Each component has an isolated LLM document specification.',
          customSets: componentCustomSets,
          optionalLinks: dedicatedOptionalLinks,
        }),
      ],
      sidebar: [
        {
          label: 'GUIDE',
          collapsed: false,
          items: [
            { label: 'Getting Started', link: '/' },
            { label: 'Theme & Global Config', link: '/guides/theme' },
            { label: 'Component Architecture & API Specs', link: '/guides/architecture' },
          ],
        },
        {
          label: 'COMPONENTS',
          collapsed: false,
          items: [
            {
              label: 'Header',
              autogenerate: { directory: 'components/header' },
            },
            {
              label: 'Card',
              autogenerate: { directory: 'components/card' },
            },
            {
              label: 'FlashCard',
              autogenerate: { directory: 'components/flashcard' },
            },
            {
              label: 'Footer',
              autogenerate: { directory: 'components/footer' },
            },
          ],
        },
        {
          label: 'BLOCKS',
          collapsed: false,
          items: [
            {
              label: 'Carousel',
              autogenerate: { directory: 'blocks/carousel' },
            },
            {
              label: 'Categories',
              autogenerate: { directory: 'blocks/categories' },
            },
            {
              label: 'FlashSale',
              autogenerate: { directory: 'blocks/flashsale' },
            },
            {
              label: 'ProductList',
              autogenerate: { directory: 'blocks/productlist' },
            },
            {
              label: 'Promotion',
              autogenerate: { directory: 'blocks/promotion' },
            },
            {
              label: 'Services',
              autogenerate: { directory: 'blocks/services' },
            },
          ],
        },
        {
          label: 'PAGES',
          collapsed: false,
          items: [
            {
              label: 'Shop',
              autogenerate: { directory: 'pages/shop' },
            },
            {
              label: 'Detail',
              autogenerate: { directory: 'pages/detail' },
            },
            {
              label: 'About',
              autogenerate: { directory: 'pages/about' },
            },
            {
              label: 'Contact',
              autogenerate: { directory: 'pages/contact' },
            },
          ],
        },
      ],
      customCss: [
        './src/styles/custom.css',
      ],
    }),
  ],
});
