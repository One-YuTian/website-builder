import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
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
              label: 'ProductList',
              autogenerate: { directory: 'blocks/productlist' },
            },
          ],
        },
        {
          label: 'PAGES',
          collapsed: true,
          items: [
            { label: 'Templates (Planning)', link: '/' },
          ],
        },
      ],
      customCss: [
        './src/styles/custom.css',
      ],
    }),
  ],
});
