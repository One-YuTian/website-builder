import { createSkeleton, themeConfig } from '../index.js';
import { foundationDemo } from '../foundations.js';
import { codeDocumentation, sourceCode } from './code-docs.js';

const description = `静态装饰骨架，无真实图片或业务文案；不表示正在加载。Logo 显示中性 LOGO 标识，图片显示 CSS 图片符号。文字继承所在区域的字号或通过 font-size 设置基准字号，统一增加3px，再按有效字号的0.75倍计算骨架高度。交互控件的语义由父元素提供。

| 区域 | 类型 | 用途 | 尺寸/比例 | 响应式 |
| --- | --- | --- | --- | --- |
| logo | Logo | 品牌占位，显示 LOGO | 默认128×40px | 支持自定义尺寸 |
| media | 图片 | 主图、封面占位，含图片符号 | 默认 16:9，演示 4:3 | 宽度随容器，符号自动限制尺寸 |
| circle | 图标形状 | 圆形功能图标占位 | 默认 48×48 | 固定尺寸；头像图片使用 image + radius |
| title | 文案 | 标题占位 | 高0.75em，宽75% | 按字号缩放 |
| text | 文案 | 正文、标签、导航占位 | 高0.75em，支持1–12行 | 按字号缩放，末行较短 |
| button | 文案 | 操作文字占位 | 宽80px，高0.75em | 外层button保留交互 |

交互演示中的按钮通过鼠标、Enter、Space 切换主图骨架圆角；两实例互不影响。无公共业务事件。`;

export default {
  title: 'Foundations/Skeleton',
  component: 'skeleton-placeholder',
  tags: ['autodocs'],
  args: { kind: 'text', lines: 3, width: '100%', fontSize: '16px', height: '', ratio: '', radius: '' },
  argTypes: {
    kind: { control: 'select', options: ['logo', 'image', 'text', 'title', 'circle', 'button'], description: '占位内容类型；logo/image 自动显示类型标识' },
    fontSize: { control: 'text', description: '对应 font-size；留空则继承父级字号。文字骨架高0.75em' },
    lines: { control: { type: 'number', min: 1, max: 12 }, description: '仅 text 生效，限制 1–12 行' },
    width: { control: 'text', description: 'CSS 长度，如 100%、12rem' },
    height: { control: 'text', description: '可选 CSS 长度' },
    ratio: { control: 'text', description: '正数宽高比，如 4/3' },
    radius: { control: 'text', description: '圆角 CSS 长度，如 12px' },
  },
  render: args => {
    const wrapper = document.createElement('div');
    wrapper.className = 'max-w-xl p-6';
    wrapper.append(createSkeleton(args));
    return wrapper;
  },
  parameters: { docs: { description: { component: codeDocumentation('skeleton-placeholder', description) }, source: {
    code: sourceCode('skeleton-placeholder'),
    language: 'html',
  } } },
};
export const Playground = {};
export const Image = { args: { kind: 'image', ratio: '4/3' } };
export const Logo = { args: { kind: 'logo', width: '128px', height: '40px' } };
export const Title = { args: { kind: 'title', fontSize: '32px', width: '75%' } };
export const Circle = { args: { kind: 'circle', width: '48px' } };
export const ButtonContent = { args: { kind: 'button', width: '80px' } };
export const Typography = {
  name: '文字字号层级',
  render: () => {
    const root = document.createElement('section');
    root.className = 'grid max-w-3xl gap-6 p-6';
    for (const size of [12, 14, 16, 18, 24, 32]) {
      const row = document.createElement('div');
      row.className = 'grid grid-cols-[96px_minmax(0,1fr)] items-center gap-4';
      const label = document.createElement('span');
      label.className = 'text-sm text-slate-500';
      label.textContent = `${size} → ${size + themeConfig.skeletonTextSizeOffset}px`;
      const preview = document.createElement('div');
      preview.style.fontSize = `${size}px`;
      preview.append(createSkeleton({ kind: 'text', width: '80%' }));
      row.append(label, preview); root.append(row);
    }
    return root;
  },
};
const demo = () => {
  const wrapper = document.createElement('div');
  wrapper.className = 'p-6';
  wrapper.append(foundationDemo());
  return wrapper;
};
export const PC = { render: demo, parameters: { viewport: { defaultViewport: 'pc' } } };
export const Tablet = { render: demo, parameters: { viewport: { defaultViewport: 'tablet' } } };
export const Mobile = { render: demo, parameters: { viewport: { defaultViewport: 'mobile' } } };
