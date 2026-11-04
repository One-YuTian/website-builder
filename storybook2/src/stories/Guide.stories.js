import { catalog } from '../catalog.js';

function article(markup) {
  const element = document.createElement('article');
  element.className = 'mx-auto max-w-4xl space-y-5 p-6 font-sans text-slate-800';
  element.innerHTML = markup;
  return element;
}

export default { title: 'Guide/Getting Started', parameters: { controls: { disable: true } } };
export const Introduction = { name: '框架说明', render: () => article(`
  <h1 class="text-3xl font-semibold">storybook2 · 精简组件库</h1>
  <p>包含框架、Foundations 骨架基础能力及逐个重写的业务组件。已验收业务组件：${catalog.length} 个。</p>
  <p>${catalog.map(entry => entry.name).join('、') || '暂无已验收业务组件'}</p>
  <p>原生 Web Components 使用 Light DOM。组件Doc展示实际实现及完整HTML组合代码，直接复制运行，无需项目入口或import。在线CDN提供Tailwind与Google Font，组件共享主题、内容宽度、圆角和断点。</p>
  <h2 class="text-xl font-semibold">展示与文档边界</h2>
  <p>组件中的图片、标题、正文、按钮、导航及表单可见文案全部使用骨架。说明文档和 Storybook 管理界面使用正常文字。骨架是设计占位，不代表持续加载。</p>
  <p>文字骨架按对应字号区分尺寸；Logo 显示中性 LOGO 标识，图片显示图片符号。这些占位标识不属于业务文案。</p>
  <h2 class="text-xl font-semibold">统一使用</h2>
  <p>轮播Doc分别提供PC与Paid/Mobile两段完整组合代码，并提供同页响应式组合示例。Header通用变量见Components / Header / Doc，全局配置见Guide / 全局配置。</p>
  <a href="/playground/index.html" target="_blank" rel="noopener" class="inline-block rounded-lg bg-primary px-4 py-3 text-white">打开 Playground 演练场</a>
  <p>PC、Tablet、Mobile 使用工具栏真实视口：1440、768、390 CSS 像素。构建后的独立入口为 /standalone/。</p>
`) };

export const Migration = { name: '迁移流程', render: () => article(`
  <h1 class="text-3xl font-semibold">逐个重写与验收</h1>
  <ol class="list-decimal space-y-3 pl-6">
    <li>定位 storybook 的原组件，记录 ID、站点、页面及目标选择器。</li>
    <li>分析保留的布局与交互，删除整页上下文、重复结构及原站业务依赖。</li>
    <li>复制 templates/component 下的模板，按 Header-01、Header-02 等至少两位编号命名；标签直接使用 header-01 等稳定 ID。</li>
    <li>全部可见内容换为骨架；真实交互控件保留语义、键盘操作及无障碍名称。</li>
    <li>完成区域对应表、属性、事件、来源和验收记录，通过检查后加入目录。</li>
  </ol>
  <p>每个业务组件必须提交实现、Story、README 和 source.json；不得直接复制原站脚本、样式、图片或 vendor。</p>
  <p>执行 npm run verify、npm run build、npm run test:browser。CDN 需要网络；失败会显示提示，系统字体作为字体回退。</p>
`) };
