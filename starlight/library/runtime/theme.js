import { themeConfig, themePresets } from '../config/theme.js';

export const fontStack = `${JSON.stringify(themeConfig.font.family)}, ${themeConfig.font.fallback}`;

/** 全文档主题：普通站点和 Storybook 使用同一个入口，不向单组件传主题参数。 */
export function applyTheme({ preset = 'default', contentMaxWidth = themeConfig.contentMaxWidth } = {}, doc = document) {
  if (!Object.hasOwn(themePresets, preset)) throw new Error(`未知全局主题：${preset}`);
  if (!Number.isFinite(contentMaxWidth) || contentMaxWidth <= 0) throw new Error('全局内容宽度必须是正数');
  const root = doc.documentElement;
  const colors = { ...themeConfig.colors, ...themePresets[preset] };
  for (const [name, value] of Object.entries(colors)) {
    const key = name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    root.style.setProperty(`--theme-${key}`, value);
  }
  root.style.setProperty('--theme-content-max-width', `${contentMaxWidth}px`);
  root.style.setProperty('--theme-radius', `${themeConfig.radius}px`);
  root.style.setProperty('--theme-radius-sm', `${themeConfig.radii.sm}px`);
  root.style.setProperty('--theme-radius-md', `${themeConfig.radii.md}px`);
  root.style.setProperty('--theme-radius-lg', `${themeConfig.radii.lg}px`);
  root.style.setProperty('--theme-radius-xl', `${themeConfig.radii.xl}px`);
  root.style.setProperty('--theme-font', fontStack);
  root.style.setProperty('--theme-gutter-mobile', `${themeConfig.gutters.mobile}px`);
  root.style.setProperty('--theme-gutter-desktop', `${themeConfig.gutters.desktop}px`);
  root.style.setProperty('--theme-skeleton-text-offset', `${themeConfig.skeletonTextSizeOffset}px`);
  root.dataset.themePreset = preset;
}

export const themeCss = `
  @theme {
    ${Object.entries(themeConfig.breakpoints).map(([key, value]) => `--breakpoint-${key}: ${value / 16}rem;`).join('\n')}
  }
  @theme inline {
    --font-sans: var(--theme-font);
    --color-primary: var(--theme-primary);
    --color-secondary: var(--theme-secondary);
    --color-accent: var(--theme-accent);
    --color-surface: var(--theme-surface);
    --color-content: var(--theme-text);
    --color-muted: var(--theme-muted);
    --color-outline: var(--theme-border);
    --color-on-secondary: var(--theme-on-secondary);
    --radius-sm: var(--theme-radius-sm, calc(var(--theme-radius) / 2));
    --radius-md: var(--theme-radius-md, calc(var(--theme-radius) * 0.75));
    --radius-lg: var(--theme-radius-lg, var(--theme-radius));
    --radius-xl: var(--theme-radius-xl, calc(var(--theme-radius) * 1.5));
  }
  @layer base {
    :root { --theme-gutter: ${themeConfig.gutters.mobile}px; }
    @media (width >= ${themeConfig.breakpoints.md / 16}rem) { :root { --theme-gutter: ${themeConfig.gutters.desktop}px; } }
    body { margin: 0; font-family: var(--theme-font); color: var(--theme-text); }
    skeleton-placeholder { display: block; min-width: 0; }
  }
  @utility content-container {
    width: 100%;
    max-width: calc(var(--theme-content-max-width) + var(--theme-gutter) * 2);
    margin-inline: auto;
    padding-inline: var(--theme-gutter);
  }
`;
