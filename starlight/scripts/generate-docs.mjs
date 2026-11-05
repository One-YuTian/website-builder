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

// Clean up old directories
for (const old of ['card', 'carousel', 'footer', 'header', 'productlist', 'components', 'blocks', 'pages']) {
  const p = path.join(contentDocsDir, old);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
  }
}

// Clean up public llms directory
if (fs.existsSync(publicLlmsDir)) {
  fs.rmSync(publicLlmsDir, { recursive: true, force: true });
}

// Ensure directories exist
fs.mkdirSync(path.join(contentDocsDir, 'guides'), { recursive: true });
fs.mkdirSync(publicLlmsDir, { recursive: true });

// Helper: Strip all comments from code for clean display
function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^\:\'\"\`])\/\/[^\r\n]*/g, '$1')
    .split('\n')
    .map(line => line.trimEnd())
    .filter((line, idx, arr) => {
      if (!line.trim() && idx > 0 && !arr[idx - 1].trim()) return false;
      return true;
    })
    .join('\n')
    .trim();
}

// 1. Get component JavaScript source code (Standalone Web Component, no base.js, no comments)
function getComponentJsCode(entry) {
  const dir = path.join(storybook2Dir, 'src/components', entry.id);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'mobile.js');
  const blocks = [];

  for (const f of files) {
    let code = fs.readFileSync(path.join(dir, f), 'utf8');
    code = stripComments(code);
    if (code.trim()) {
      blocks.push(code.trim());
    }
  }

  return blocks.join('\n\n');
}

// 2. Extract component-specific CSS styles (if any, no comments)
function getComponentCssCode(entry) {
  const dir = path.join(storybook2Dir, 'src/components', entry.id);
  const cssFiles = fs.readdirSync(dir).filter(f => f.endsWith('.css'));
  if (cssFiles.length === 0) return '';
  const blocks = [];
  for (const f of cssFiles) {
    const code = fs.readFileSync(path.join(dir, f), 'utf8');
    const cleaned = stripComments(code);
    if (cleaned.trim()) blocks.push(cleaned.trim());
  }
  return blocks.join('\n\n');
}

// 3. Extract HTML markup fragment (clean semantic HTML, no -01, no test IDs)
function getComponentHtmlCode(entry) {
  const templatePath = path.join(storybook2Dir, `src/components/${entry.id}/template.html`);
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf8').trim();
  }

  const genericTag = (entry.kind || entry.name.split('-')[0]).toLowerCase();
  if (genericTag === 'card') {
    return `<card class="block w-full max-w-sm"></card>`;
  }
  return `<${genericTag}></${genericTag}>`;
}

// Escape curly braces in Markdown for MDX compatibility
function escapeMdxText(text) {
  return text.replace(/([^\`\n]|^)\{([^}\n]+)\}([^\`\n]|$)/g, '$1`{$2}`$3');
}

// 4. Generate 3-level component documents AND individual LLM text docs
for (const entry of catalog) {
  const level1 = (entry.group || 'Components').toLowerCase();
  const level2 = (entry.kind || entry.name.split('-')[0]).toLowerCase();
  const targetDir = path.join(contentDocsDir, level1, level2);
  const targetLlmsDir = path.join(publicLlmsDir, level1, level2);

  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(targetLlmsDir, { recursive: true });

  const readmePath = path.join(storybook2Dir, 'src/components', entry.id, 'README.md');
  const readmeRaw = fs.readFileSync(readmePath, 'utf8');

  // Strip leading title
  const readmeBody = escapeMdxText(readmeRaw.replace(/^#\s+[^\n]+\n+/, ''));

  const snippet = codeSnippets[entry.id];
  const desktopPreview = snippet?.desktop || '';
  const mobilePreview = snippet?.mobile || '';
  const responsivePreview = snippet?.responsive || '';

  const jsCode = getComponentJsCode(entry);
  const htmlCode = getComponentHtmlCode(entry);
  const cssCode = getComponentCssCode(entry);

  let previewHeight = '420px';
  if (entry.id === 'header-04') previewHeight = '480px';
  else if (entry.id.startsWith('header-')) previewHeight = '320px';
  else if (entry.id.startsWith('card-')) previewHeight = '560px';
  else if (entry.id.startsWith('footer-')) previewHeight = '400px';
  else if (entry.id.startsWith('carousel-')) previewHeight = '620px';
  else if (entry.id.startsWith('productlist-')) previewHeight = '550px';
  else if (entry.id.startsWith('shop-')) previewHeight = '780px';
  else if (entry.id.startsWith('detail-')) previewHeight = '1200px';

  // --- MDX Document (For humans & interactive preview) ---
  let mdx = `---
title: ${entry.name}
description: ${entry.name} Component specification, interactive sandbox, and source code.
---

import ComponentPreview from '../../../../components/ComponentPreview.astro';

## Interactive Preview

<ComponentPreview
  code={${JSON.stringify(responsivePreview || desktopPreview)}}
  htmlCode={${JSON.stringify(htmlCode)}}
  jsCode={${JSON.stringify(jsCode)}}
  cssCode={${JSON.stringify(cssCode)}}
  height="${previewHeight}"
  title="${entry.name} Interactive Preview"
/>

## Overview & Attributes

${readmeBody}
`;

  fs.writeFileSync(path.join(targetDir, `${entry.id}.mdx`), mdx, 'utf8');

  // --- Dedicated LLM Document (For LLM AI Agents & Prompt Context) ---
  // Pure, clean, hierarchical markdown without UI sandbox iframe wrappers or HTML noise
  const llmDoc = `# ${entry.name} Component Specification

- **Group**: ${entry.group || 'Components'}
- **Kind**: ${entry.kind || entry.name.split('-')[0]}
- **Component ID**: ${entry.id}
- **Document Route**: /${level1}/${level2}/${entry.id}
- **Global Method/Export**: window.$${level2}

## Overview & Attributes

${readmeRaw.trim()}

## HTML Usage

\`\`\`html
${htmlCode.trim()}
\`\`\`

## JavaScript Implementation (Native Web Component)

\`\`\`javascript
${jsCode.trim()}
\`\`\`
${cssCode ? `
## Component Styles (CSS)

\`\`\`css
${cssCode.trim()}
\`\`\`
` : ''}`;

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
  <Card title="Clear Source Code Tabs" icon="open-book">
    Separately displays JavaScript source, HTML markup structure, and CSS / Tailwind styling.
  </Card>
  <Card title="Interactive Pure-White Sandbox" icon="laptop">
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

Standard Tailwind CSS configuration. Components pull global CSS variables for colors (\`primary\`, \`secondary\`, \`accent\`, \`surface\`, \`content\`, \`muted\`, \`outline\`), border radius (\`sm\`, \`md\`, \`lg\`, \`xl\`), content max width (\`max-w-content\`), and gutters.

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
console.log('All documents and dedicated LLM files generated successfully!');
