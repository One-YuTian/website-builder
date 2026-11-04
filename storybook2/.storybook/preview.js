import { initializeResources, registerComponents, applyTheme } from '../src/index.js';

export default {
  initialGlobals: { theme: 'default', contentWidth: 'configured' },
  globalTypes: {
    theme: { description: '全局主题色', toolbar: { title: '主题', icon: 'paintbrush', dynamicTitle: true, items: [
      { value: 'default', title: '默认主题' }, { value: 'ocean', title: '海洋蓝' }, { value: 'forest', title: '森林绿' },
    ] } },
    contentWidth: { description: '全局内容最大宽度', toolbar: { title: '内容宽度', icon: 'sidebar', dynamicTitle: true, items: [
      { value: 'configured', title: '配置默认宽度' }, { value: '1120', title: '1120px' }, { value: '1200', title: '1200px' }, { value: '1440', title: '1440px' },
    ] } },
  },
  loaders: [async ({ globals }) => {
    await initializeResources();
    applyTheme({ preset: globals.theme || 'default', ...(globals.contentWidth && globals.contentWidth !== 'configured' ? { contentMaxWidth: Number(globals.contentWidth) } : {}) });
    registerComponents();
    return {};
  }],
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
    viewport: { viewports: {
      pc: { name: 'PC · 1440', styles: { width: '1440px', height: '960px' } },
      tablet: { name: 'Tablet · 768', styles: { width: '768px', height: '1024px' } },
      mobile: { name: 'Mobile · 390', styles: { width: '390px', height: '844px' } },
    } },
    options: { storySort: { order: ['Guide', 'Foundations', 'Components', 'Blocks', 'Pages', 'Features'] } },
  },
};
