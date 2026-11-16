import { themeConfig } from './theme.js';

export const resources = Object.freeze({
  tailwind: 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.1.13/dist/index.global.js',
  tailwindFallback: 'https://unpkg.com/@tailwindcss/browser@4.1.13/dist/index.global.js',
  jquery: 'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
  jqueryFallback: 'https://unpkg.com/jquery@3.7.1/dist/jquery.min.js',
  swiper: 'https://cdn.jsdelivr.net/npm/swiper@10.3.1/swiper-bundle.min.js',
  swiperFallback: 'https://unpkg.com/swiper@10.3.1/swiper-bundle.min.js',
  swiperCss: 'https://cdn.jsdelivr.net/npm/swiper@10.3.1/swiper-bundle.min.css',
  swiperCssFallback: 'https://unpkg.com/swiper@10.3.1/swiper-bundle.min.css',
  font: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(themeConfig.font.family)}:wght@${themeConfig.font.weights.join(';')}&display=swap`,
});
