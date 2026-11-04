import { themeConfig } from './src/config/theme.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,html}',
    './public/**/*.html',
  ],
  theme: {
    screens: Object.fromEntries(
      Object.entries(themeConfig.breakpoints).map(([k, v]) => [k, `${v}px`])
    ),
    extend: {
      colors: {
        primary: 'var(--theme-primary, ' + themeConfig.colors.primary + ')',
        secondary: 'var(--theme-secondary, ' + themeConfig.colors.secondary + ')',
        accent: 'var(--theme-accent, ' + themeConfig.colors.accent + ')',
        surface: 'var(--theme-surface, ' + themeConfig.colors.surface + ')',
        content: 'var(--theme-text, ' + themeConfig.colors.text + ')',
        muted: 'var(--theme-muted, ' + themeConfig.colors.muted + ')',
        outline: 'var(--theme-border, ' + themeConfig.colors.border + ')',
        'on-secondary': 'var(--theme-on-secondary, ' + themeConfig.colors.onSecondary + ')',
      },
      fontFamily: {
        sans: ['var(--theme-font)', themeConfig.font.family, themeConfig.font.fallback],
      },
      borderRadius: {
        sm: 'var(--theme-radius-sm, calc(var(--theme-radius, ' + themeConfig.radius + 'px) / 2))',
        md: 'var(--theme-radius-md, calc(var(--theme-radius, ' + themeConfig.radius + 'px) * 0.75))',
        lg: 'var(--theme-radius-lg, var(--theme-radius, ' + themeConfig.radius + 'px))',
        xl: 'var(--theme-radius-xl, calc(var(--theme-radius, ' + themeConfig.radius + 'px) * 1.5))',
      },
      maxWidth: {
        content: 'calc(var(--theme-content-max-width, ' + themeConfig.contentMaxWidth + 'px) + var(--theme-gutter, 24px) * 2)',
      },
      spacing: {
        gutter: 'var(--theme-gutter, 24px)',
      },
    },
  },
  plugins: [],
};
