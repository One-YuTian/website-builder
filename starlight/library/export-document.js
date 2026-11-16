// 生成普通 HTML 文档；运行代码直接内嵌，不依赖任何项目运行入口。
import { themeConfig, themePresets } from './config/theme.js';

export function createDocument(items, runtimes, { contentWidth = themeConfig.contentMaxWidth, preset = 'default', title = '组件组合', device = 'responsive' } = {}) {
  const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  const scripts = [...new Set(items.map(item => item.id))].map(id => runtimes[id]).filter(Boolean);
  const properties = [];
  const body = items.map((item, index) => {
    if (item.customHtml) {
      return item.customHtml.trim();
    }
    const id = `component-${index + 1}`;
    const tags = device !== 'desktop' && (item.id === 'carousel-01' || item.id === 'carousel-03') ? [item.id, `${item.id}-mobile`] : [item.id];
    const markup = tags.map((tag, variant) => {
      const elementId = `${id}-${variant}`;
      properties.push({ id: elementId, values: item.props || {} });
      const isCard = tag.startsWith('card-') || tag.startsWith('flashcard-');
      const isCart = tag.startsWith('cart-');
      if (isCart) {
        return `<${tag} id="${elementId}" view-mode="drawer" open class="block w-full"></${tag}>`;
      }
      const node = `<${tag} id="${elementId}"${isCard ? ` class="block w-full ${item.props?.viewMode === 'list' ? 'max-w-3xl' : 'max-w-sm'}"` : ''}></${tag}>`;
      return isCard ? `<div class="w-full max-w-content mx-auto px-4 sm:px-6 py-6 flex justify-center">${node}</div>` : node;
    }).join('\n');
    return markup;
  }).join('\n');
  const colors = { ...themeConfig.colors, ...(themePresets[preset] || {}) };
  const values = Object.fromEntries(Object.entries(colors).map(([name, value]) => [`--theme-${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`, value]));
  values['--theme-content-max-width'] = `${Number.isFinite(contentWidth) && contentWidth > 0 ? contentWidth : themeConfig.contentMaxWidth}px`;
  const data = JSON.stringify({ properties, values }).replaceAll('<', '\\u003c');
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(title)}</title>
</head>
<body>
${body}
<script>
// 下方是组件实际实现（含共享骨架、主题及在线资源加载代码）。
${scripts.join('\n').replaceAll('</script', '<\\/script')}
// 配置和实例变量；只需修改本段即可调整组合。
(() => {
const configuration = ${data};
for (const [name, value] of Object.entries(configuration.values)) document.documentElement.style.setProperty(name, value);
for (const item of configuration.properties) {
  const element = document.getElementById(item.id);
  if (!element) continue;
  for (const [name, value] of Object.entries(item.values)) element[name] = value;
  if (element.localName.startsWith('header-')) element.addEventListener('header-search-input', event => {
    element.searchSuggestions = event.detail.query.length >= 2 ? [{ id: 'demo-product-1' }] : [];
  });
}
})();
</script>
</body>
</html>`;
}
