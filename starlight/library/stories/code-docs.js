import { codeSnippets } from '../generated/examples.js';

export function sourceCode(tag, device = 'desktop') { return codeSnippets[tag]?.[device] || ''; }
export function codeDocumentation(tag, description) {
  const code = codeSnippets[tag];
  if (!code) return description;
  const paired = tag.startsWith('carousel-');
  return `${description}\n\n### ${paired ? 'PC 完整组合代码' : '完整组合代码'}\n\n保存为 HTML 后即可直接运行；组件实现、WebComponent 注册、原生 JavaScript、jQuery事件示例、Tailwind 和 Google Font 都在这份代码中。\n\n\`\`\`html\n${code.desktop}\n\`\`\`\n${paired ? `\n### Paid / Mobile 独立适配代码\n\n这是一份独立可运行的移动端实现；同页组合可使用 [完整响应式示例](/code/${tag}-responsive.html)。\n\n\`\`\`html\n${code.mobile}\n\`\`\`\n` : ''}`;
}
