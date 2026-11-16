import { registerComponents } from '../index.js';
import { codeDocumentation, sourceCode } from './code-docs.js';

export function createHeaderStory(name, tag, description) {
  return {
    title: `Components/Header/${name}`,
    component: tag,
    tags: ['autodocs'],
    args: { isLoggedIn: false, cartCount: 3, wishlistCount: 2, theme: tag === 'header-05' ? 'light' : 'dark' },
    argTypes: {
      theme: { control: { type: 'inline-radio' }, options: ['dark', 'light'], description: '深色 / 浅色主题模式（反转颜色）' },
      isLoggedIn: { control: 'boolean', description: '统一 Header 登录状态' },
      cartCount: { control: { type: 'number', min: 0 }, description: '购物车数量' },
      wishlistCount: { control: { type: 'number', min: 0 }, description: '收藏数量（可见入口依组件布局而定）' },
    },
    render: args => {
      registerComponents();
      const root = document.createElement('div');
      root.className = 'min-h-[180vh]';
      const header = document.createElement(tag);
      header.theme = args.theme || (tag === 'header-05' ? 'light' : 'dark');
      if (args.theme) header.setAttribute('theme', args.theme);
      header.isLoggedIn = args.isLoggedIn;
      header.cartCount = args.cartCount;
      header.wishlistCount = args.wishlistCount;
      header.addEventListener('header-search-input', ({ detail }) => {
        header.searchSuggestions = detail.query.length >= 2 ? [{ id: 'demo-product-1' }, { id: 'demo-product-2' }] : [];
      });
      root.append(header);
      return root;
    },
    parameters: { docs: { description: { component: codeDocumentation(tag, description) }, story: { inline: false, height: tag === 'header-04' ? '480px' : '360px' }, source: {
      code: sourceCode(tag), language: 'html',
    } } },
  };
}
