/**
 * Tailwind CSS 全局配置与主题变量定义
 * 采用 JavaScript 原生语法，便于在 HTML 中通过 <script src="tailwind.config.js"></script> 直接引入。
 */

// 1. 全局设计系统与主题变量配置
const themeConfig = {
  colors: {
    primary: '#bd0e16',
    secondary: '#000000',
    accent: '#e2e8f0',
    surface: '#ffffff',
    text: '#0f172a',
    muted: '#64748b',
    border: '#cbd5e1',
    onSecondary: '#ffffff',
  },
  contentMaxWidth: 1200,
  gutters: {
    mobile: 16,
    desktop: 24,
  },
  font: {
    family: 'Noto Sans SC',
    weights: [400, 500, 600, 700],
    fallback: 'ui-sans-serif, system-ui, sans-serif',
  },
  radius: 8,
  radii: {
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
  },
  skeletonTextSizeOffset: 3,
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
};

// 预设主题配置
const themePresets = {
  default: {},
  ocean: { primary: '#2563eb', secondary: '#172554', accent: '#dbeafe' },
  forest: { primary: '#15803d', secondary: '#052e16', accent: '#dcfce7' },
};

// 2. Tailwind 基础与扩展规则配置
const tailwindConfig = {
  content: [
    './src/**/*.{js,html}',
    './public/**/*.html',
    './*.html',
  ],
  theme: {
    screens: {
      sm: `${themeConfig.breakpoints.sm}px`,
      md: `${themeConfig.breakpoints.md}px`,
      lg: `${themeConfig.breakpoints.lg}px`,
      xl: `${themeConfig.breakpoints.xl}px`,
      '2xl': `${themeConfig.breakpoints['2xl']}px`,
    },
    extend: {
      colors: {
        primary: `var(--theme-primary, ${themeConfig.colors.primary})`,
        secondary: `var(--theme-secondary, ${themeConfig.colors.secondary})`,
        accent: `var(--theme-accent, ${themeConfig.colors.accent})`,
        surface: `var(--theme-surface, ${themeConfig.colors.surface})`,
        content: `var(--theme-text, ${themeConfig.colors.text})`,
        muted: `var(--theme-muted, ${themeConfig.colors.muted})`,
        outline: `var(--theme-border, ${themeConfig.colors.border})`,
        'on-secondary': `var(--theme-on-secondary, ${themeConfig.colors.onSecondary})`,
      },
      fontFamily: {
        sans: ['var(--theme-font)', themeConfig.font.family, themeConfig.font.fallback],
      },
      borderRadius: {
        sm: `var(--theme-radius-sm, calc(var(--theme-radius, ${themeConfig.radius}px) / 2))`,
        md: `var(--theme-radius-md, calc(var(--theme-radius, ${themeConfig.radius}px) * 0.75))`,
        lg: `var(--theme-radius-lg, var(--theme-radius, ${themeConfig.radius}px))`,
        xl: `var(--theme-radius-xl, calc(var(--theme-radius, ${themeConfig.radius}px) * 1.5))`,
      },
      maxWidth: {
        content: `calc(var(--theme-content-max-width, ${themeConfig.contentMaxWidth}px) + var(--theme-gutter, 24px) * 2)`,
      },
      spacing: {
        gutter: 'var(--theme-gutter, 24px)',
      },
    },
  },
  plugins: [],
};

// 3. 在浏览器及 HTML 运行环境中挂载配置
if (typeof window !== 'undefined') {
  window.tailwind = window.tailwind || {};
  window.tailwind.config = tailwindConfig;
  window.themeConfig = themeConfig;
  window.themePresets = themePresets;
}
if (typeof tailwind !== 'undefined') {
  tailwind.config = tailwindConfig;
}

// 4. 在 CommonJS / Node.js 构建工具环境中导出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = tailwindConfig;
  module.exports.themeConfig = themeConfig;
  module.exports.themePresets = themePresets;
}
