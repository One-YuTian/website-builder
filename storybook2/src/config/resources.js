import { themeConfig } from './theme.js';

export const resources = Object.freeze({
  tailwind: 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.1.13/dist/index.global.js',
  tailwindFallback: 'https://unpkg.com/@tailwindcss/browser@4.1.13/dist/index.global.js',
  jquery: 'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
  jqueryFallback: 'https://unpkg.com/jquery@3.7.1/dist/jquery.min.js',
  font: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(themeConfig.font.family)}:wght@${themeConfig.font.weights.join(';')}&display=swap`,
});
