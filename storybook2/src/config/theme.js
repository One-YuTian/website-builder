
export const themeConfig = Object.freeze({
  colors: Object.freeze({
    primary: '#bd0e16',
    secondary: '#000000',
    accent: '#e2e8f0',
    surface: '#ffffff',
    text: '#0f172a',
    muted: '#64748b',
    border: '#cbd5e1',
    onSecondary: '#ffffff',
  }),
  contentMaxWidth: 1200,
  gutters: Object.freeze({ mobile: 16, desktop: 24 }),
  font: Object.freeze({
    family: 'Noto Sans SC',
    weights: [400, 500, 600, 700],
    fallback: 'ui-sans-serif, system-ui, sans-serif'
  }),
  radius: 8,
  radii: Object.freeze({
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
  }),
  skeletonTextSizeOffset: 3,
  breakpoints: Object.freeze({ sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 }),
});

export const themePresets = Object.freeze({
  default: Object.freeze({}),
  ocean: Object.freeze({ primary: '#2563eb', secondary: '#172554', accent: '#dbeafe' }),
  forest: Object.freeze({ primary: '#15803d', secondary: '#052e16', accent: '#dcfce7' }),
});

