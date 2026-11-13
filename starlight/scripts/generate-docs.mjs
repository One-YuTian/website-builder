import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalog } from '../../storybook2/src/catalog.js';
import { codeSnippets } from '../../storybook2/src/generated/examples.js';
import { themeCss } from '../../storybook2/src/runtime/theme.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const starlightDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(starlightDir, '..');
const storybook2Dir = path.resolve(rootDir, 'storybook2');
const contentDocsDir = path.resolve(starlightDir, 'src/content/docs');
const publicDir = path.resolve(starlightDir, 'public');
const publicLlmsDir = path.join(publicDir, 'llms');

function assertInside(base, target) {
  const relative = path.relative(path.resolve(base), path.resolve(target));
  if (!relative || relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw new Error(`Unsafe generated path: ${target}`);
}

// Clean up old directories
for (const old of ['card', 'carousel', 'footer', 'header', 'productlist', 'components', 'blocks', 'pages']) {
  const p = path.join(contentDocsDir, old);
  if (fs.existsSync(p)) {
    assertInside(contentDocsDir, p);
    fs.rmSync(p, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

// Clean up public llms directory
if (fs.existsSync(publicLlmsDir)) {
  assertInside(publicDir, publicLlmsDir);
  fs.rmSync(publicLlmsDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

// Ensure directories exist
fs.mkdirSync(path.join(contentDocsDir, 'guides'), { recursive: true });
fs.mkdirSync(publicLlmsDir, { recursive: true });

// Helper: Extract actual component HTML from demo or source template
function getComponentHtml(entry, fullHtml) {
  // If entry has a template.html in its source directory
  const templatePath = path.join(storybook2Dir, `src/components/${entry.id}/template.html`);
  if (fs.existsSync(templatePath)) {
    const raw = fs.readFileSync(templatePath, 'utf8').trim();
    if (raw) return raw;
  }

  // Fallback: extract body content between <body> and <script> from demo HTML
  if (fullHtml) {
    const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<script[^>]*>/i);
    if (bodyMatch) return bodyMatch[1].trim();
  }

  return `<${entry.id}></${entry.id}>`;
}

// Helper: Extract pure component JavaScript (ONLY the component's own code, no sandbox/Skeleton/theme boilerplate)
function getPureComponentJs(entry) {
  const compDir = path.join(storybook2Dir, 'src/components', entry.id);
  const indexPath = path.join(compDir, 'index.js');
  if (!fs.existsSync(indexPath)) return '';

  let code = fs.readFileSync(indexPath, 'utf8').trim();

  // If it is a Web Component class
  if (code.includes('extends HTMLElement')) {
    const classMatch = code.match(/class\s+([A-Za-z0-9_]+)\s+extends\s+HTMLElement/);
    const className = classMatch ? classMatch[1] : 'Component';

    // Remove 'export '
    code = code.replace(/export\s+class\s+/, 'class ');

    // Append customElements definition if not already registered
    if (!code.includes(`customElements.define('${entry.id}'`)) {
      code += `\n\nif (!customElements.get('${entry.id}')) {\n  customElements.define('${entry.id}', ${className});\n}`;
    }
  }

  return code.trim();
}

// Helper: Extract CSS from demo if any
function extractDemoCss(fullHtml) {
  if (!fullHtml) return '';
  const styleMatch = fullHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  return styleMatch ? styleMatch[1].trim() : '';
}

// Escape curly braces in Markdown for MDX compatibility
function escapeMdxText(text) {
  return text.replace(/([^\`\n]|^)\{([^}\n]+)\}([^\`\n]|$)/g, '$1`{$2}`$3');
}

function cleanOverview(text) {
  return text.replace(/^(?:## Overview|# [^\n]+)\s*/i, '').replace(/^## Overview\s*/i, '')
    .replaceAll('`content-container`', 'Tailwind container (`w-full max-w-content mx-auto px-4 lg:px-6`)')
    .replaceAll('content-container', 'w-full max-w-content mx-auto px-4 lg:px-6')
    .trim();
}

// Card overview helper (Pure English for English tab / LLM doc, clean Chinese for Chinese tab)
function cardOverview(entry, js, chinese = false) {
  const attributes = js.match(/observedAttributes\s*=\s*\[([^\]]*)\]/)?.[1]?.match(/['"]([^'"]+)['"]/g)?.map(value => value.slice(1, -1)) || [];
  const actions = [...new Set([...js.matchAll(/data-action=["']([^"']+)["']/g)].map(match => match[1]))];
  const events = [...new Set([...js.matchAll(/this\.emit\(['"]([^'"]+)['"]/g)].map(match => match[1]))];
  const productId = js.match(/get productId\(\)[\s\S]*?\|\|\s*['"]([^'"]+)['"]/)?.[1];

  return chinese
    ? `${entry.name} 商品卡片实例。以本实例源码与模板为准，各功能区域通过英文注释直接标注于代码中。\n\n### 尺寸与适配\n\n保留实际渲染的图片容器比例、Grid/List 分支、宽度和 Tailwind 断点。\n\n### 属性与操作\n\n- 实际 observedAttributes：${attributes.map(value => `\`${value}\``).join('、') || '无'}。${productId ? `product-id 默认值为 \`${productId}\`。` : ''}\n- 本实例操作：${actions.map(value => `\`${value}\``).join('、') || '见组件事件绑定'}。\n- 组件事件：${events.map(value => `\`${value}\``).join('、') || '见源码事件处理'}。`
    : `${entry.name} product-card component variant. Regions and interactions are annotated directly within the code implementation via English comments.\n\n### Dimensions & Responsiveness\n\nRetains the actual render image-container aspect ratio, Grid/List branches, widths and Tailwind breakpoints.\n\n### Attributes & Operations\n\n- Actual observedAttributes: ${attributes.map(value => `\`${value}\``).join(', ') || 'none'}.${productId ? ` product-id defaults to \`${productId}\`.` : ''}\n- Implemented actions: ${actions.map(value => `\`${value}\``).join(', ') || 'see event binding'}.\n- Component events: ${events.map(value => `\`${value}\``).join(', ') || 'see source event handling'}.`;
}

// 4. Generate 3-level component documents AND individual LLM text docs
for (const entry of catalog) {
  const level1 = (entry.group || 'Components').toLowerCase();
  const level2 = (entry.kind || entry.name.split('-')[0]).toLowerCase();
  const targetDir = path.join(contentDocsDir, level1, level2);
  const targetLlmsDir = path.join(publicLlmsDir, level1, level2);

  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(targetLlmsDir, { recursive: true });

  const enReadmePath = path.join(storybook2Dir, 'src/components', entry.id, 'README.en.md');
  const zhReadmePath = path.join(storybook2Dir, 'src/components', entry.id, 'README.md');

  const enReadmeRaw = fs.existsSync(enReadmePath) ? fs.readFileSync(enReadmePath, 'utf8').trim() : '';
  const zhReadmeRaw = fs.existsSync(zhReadmePath) ? fs.readFileSync(zhReadmePath, 'utf8').trim() : '';

  // Strip leading # Title from Chinese doc
  const zhReadmeBody = zhReadmeRaw.replace(/^#\s+[^\n]+\n+/, '').trim();

  const snippet = codeSnippets[entry.id];
  const desktopPreview = snippet?.desktop || '';
  const mobilePreview = snippet?.mobile || '';
  const responsivePreview = snippet?.responsive || '';
  const activeDemo = responsivePreview || desktopPreview || '';

  // Extract pure component implementation code
  const htmlCode = getComponentHtml(entry, activeDemo);
  const jsCode = getPureComponentJs(entry);
  const cssCode = extractDemoCss(activeDemo);

  const isCard = ['card', 'flashcard'].includes(level2);
  const overview = isCard ? cardOverview(entry, jsCode, false) : cleanOverview(enReadmeRaw);
  const chineseOverview = isCard ? cardOverview(entry, jsCode, true) : cleanOverview(zhReadmeBody);

  let previewHeight = '420px';
  if (entry.id === 'header-04') previewHeight = '480px';
  else if (entry.id === 'cart-01') previewHeight = '650px';
  else if (entry.id.startsWith('header-')) previewHeight = '320px';
  else if (entry.id.startsWith('card-')) previewHeight = '560px';
  else if (entry.id.startsWith('footer-')) previewHeight = '400px';
  else if (entry.id.startsWith('carousel-')) previewHeight = '620px';
  else if (entry.id.startsWith('productlist-')) previewHeight = '550px';
  else if (entry.id.startsWith('shop-')) previewHeight = '780px';
  else if (entry.id.startsWith('detail-')) previewHeight = '1200px';
  else if (entry.id.startsWith('about-')) previewHeight = '850px';
  else if (entry.id.startsWith('contact-')) previewHeight = '800px';
  else if (entry.id.startsWith('toast-')) previewHeight = '450px';
  else if (entry.id.startsWith('home-')) previewHeight = '1200px';

  // --- MDX Document (Interactive preview + Bilingual English & Chinese tabs + Actual Annotated Code) ---
  let mdx = `---
title: ${entry.name}
description: ${entry.name} Component specification, interactive sandbox, and source code.
---

import ComponentPreview from '../../../../components/ComponentPreview.astro';
import { Tabs, TabItem } from '@astrojs/starlight/components';

## Interactive Preview

<ComponentPreview
  code={${JSON.stringify(activeDemo)}}
  htmlCode={${JSON.stringify(htmlCode)}}
  jsCode={${JSON.stringify(jsCode)}}
  cssCode={${JSON.stringify(cssCode)}}
  height="${previewHeight}"
  title="${entry.name} Interactive Preview"
/>

## Documentation

<Tabs>
<TabItem label="English">

${escapeMdxText(overview)}

</TabItem>
<TabItem label="中文">

${escapeMdxText(chineseOverview)}

</TabItem>
</Tabs>

## Code

### HTML

\`\`\`html
${htmlCode.trim()}
\`\`\`

### JavaScript

\`\`\`javascript
${jsCode.trim()}
\`\`\`
${cssCode ? `
### CSS

\`\`\`css
${cssCode.trim()}
\`\`\`
` : ''}
`;

  fs.writeFileSync(path.join(targetDir, `${entry.id}.mdx`), mdx, 'utf8');

  // --- Dedicated LLM Document (Clean, Unified Structure, 100% Pure English, Zero Chinese) ---
  const llmDoc = `## Overview

${overview}

## Code

### HTML

\`\`\`html
${htmlCode.trim()}
\`\`\`

### JavaScript

\`\`\`javascript
${jsCode.trim()}
\`\`\`
${cssCode ? `
### CSS

\`\`\`css
${cssCode.trim()}
\`\`\`
` : ''}`;

  // Strict verification: Zero Chinese characters in LLM doc
  const chineseInLlm = llmDoc.match(/[\u4e00-\u9fa5]/g);
  if (chineseInLlm) {
    throw new Error(`Chinese character found in LLM doc for ${entry.id}: ${chineseInLlm.slice(0, 10).join(', ')}`);
  }

  const llmFilePath = path.join(targetLlmsDir, `${entry.id}.txt`);
  fs.writeFileSync(llmFilePath, llmDoc.trim() + '\n', 'utf8');

  console.log(`Generated doc: ${level1}/${level2}/${entry.id}.mdx & llms/${level1}/${level2}/${entry.id}.txt`);
}

// 5. Generate index.mdx
const indexMdx = `---
title: Storybook2 Component Library
description: Standard Native Web Components and Tailwind CSS Documentation
template: splash
hero:
  tagline: Standard Native Web Components + Light DOM with Storybook 8 Design Aesthetics
  actions:
    - text: Browse Components / Header
      link: /components/header/header-01/
      icon: right-arrow
      variant: primary
    - text: Theme & Global Specs
      link: /guides/theme/
      icon: external
      variant: secondary
---

import { Card, CardGrid } from '@astrojs/starlight/components';

## Features

<CardGrid stagger>
  <Card title="3-Level Hierarchy" icon="bars">
    Structured into Group (Components / Blocks / Pages), Kind (Header / Card / Footer / Carousel / ProductList), and Component items.
  </Card>
  <Card title="Dedicated LLM Documents" icon="document">
    Every component has an isolated, non-redundant plain text document under \`/llms/\` and \`/_llms-txt/\` for AI coding agents.
  </Card>
  <Card title="Bilingual Documentation" icon="translate">
    Complete English and Chinese documentation tabs available for all components.
  </Card>
  <Card title="Interactive Sandbox" icon="laptop">
    Live preview sandbox with instant Desktop (100%), Tablet (768px), and Mobile (390px) viewport switching.
  </Card>
</CardGrid>

## Catalog Index

| Group | Kind | Component ID | Component Name | Custom Element Tag | Document Link | Dedicated LLM Doc |
| --- | --- | --- | --- | --- | --- | --- |
${catalog.map(c => {
  const level1 = (c.group || 'Components').toLowerCase();
  const level2 = (c.kind || c.name.split('-')[0]).toLowerCase();
  return `| **${c.group || 'Components'}** | **${c.kind || c.name.split('-')[0]}** | \`${c.id}\` | **${c.name}** | \`<${c.tag}>\` | [Open Document](/${level1}/${level2}/${c.id}/) | [LLM Text](/llms/${level1}/${level2}/${c.id}.txt) |`;
}).join('\n')}
`;

fs.writeFileSync(path.join(contentDocsDir, 'index.mdx'), indexMdx, 'utf8');

// 6. Generate guides/theme.mdx
const themeJs = fs.readFileSync(path.join(storybook2Dir, 'src/config/theme.js'), 'utf8');
const tailwindJs = fs.readFileSync(path.join(storybook2Dir, 'tailwind.config.js'), 'utf8');
const resourcesJs = fs.readFileSync(path.join(storybook2Dir, 'src/config/resources.js'), 'utf8');
const skeletonJs = fs.readFileSync(path.join(storybook2Dir, 'src/components/skeleton.js'), 'utf8');
const markupJs = fs.readFileSync(path.join(storybook2Dir, 'src/components/shared/markup.js'), 'utf8');

const themeMdx = `---
title: Theme & Foundation Specifications
description: Storybook2 theme configuration, resource links, and foundation skeleton source.
---

## Global Tailwind Configuration (tailwind.config.js)

Standard Tailwind CSS configuration using native JavaScript syntax. Components pull global CSS variables for colors (\`primary\`, \`secondary\`, \`accent\`, \`surface\`, \`content\`, \`muted\`, \`outline\`), border radius (\`sm\`, \`md\`, \`lg\`, \`xl\`), content max width (\`max-w-content\`), and gutters.

\`\`\`javascript title="tailwind.config.js"
${tailwindJs.trim()}
\`\`\`

## Theme Variables Configuration (theme.js)

All components share colors, typography, border radius, and container breakpoints defined in \`src/config/theme.js\`.

\`\`\`javascript title="src/config/theme.js"
${themeJs.trim()}
\`\`\`

## External Resources (resources.js)

Third-party dependencies loaded from fixed-version CDNs.

\`\`\`javascript title="src/config/resources.js"
${resourcesJs.trim()}
\`\`\`

## Foundation Skeleton (skeleton.js)

Skeleton placeholders for text, title, logo, and images.

\`\`\`javascript title="src/components/skeleton.js"
${skeletonJs.trim()}
\`\`\`

## Base Element & View Utilities (markup.js)

Base class \`ViewElement\` inherited by custom elements.

\`\`\`javascript title="src/components/shared/markup.js"
${markupJs.trim()}
\`\`\`
`;

fs.writeFileSync(path.join(contentDocsDir, 'guides/theme.mdx'), themeMdx, 'utf8');

// 7. Synchronize LLM templates to local agent skill templates
const targetSkillDirs = [
  path.resolve(rootDir, '.agents/skills/website-builder/templates'),
  path.resolve(rootDir, 'codex-website-builder/skills/website-builder/templates')
];

for (const targetDir of targetSkillDirs) {
  if (fs.existsSync(path.dirname(targetDir))) {
    assertInside(rootDir, targetDir);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.cpSync(publicLlmsDir, targetDir, { recursive: true });
    const index = catalog.map(entry => {
      const group = entry.group.toLowerCase(), category = entry.kind.toLowerCase();
      return {
        id: entry.id,
        group,
        category,
        file: `${group}/${category}/${entry.id}.txt`,
        summary: `${entry.name}: Native Web Component specification, annotated regions, and responsive template.`
      };
    });
    fs.writeFileSync(path.join(path.dirname(targetDir), 'catalog.json'), JSON.stringify(index, null, 2) + '\n', 'utf8');
    console.log(`Synchronized LLM templates to ${path.relative(rootDir, targetDir)}`);
  }
}

console.log('All documents, dedicated LLM files, and skill templates synchronized successfully with pure English and annotated code regions!');
