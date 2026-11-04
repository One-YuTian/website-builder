import fs from 'node:fs';
import path from 'node:path';
import { catalog } from '../../storybook2/src/catalog.js';
import { codeSnippets } from '../../storybook2/src/generated/examples.js';
import { themeCss } from '../../storybook2/src/runtime/theme.js';

const rootDir = path.resolve('..');
const storybook2Dir = path.resolve('../storybook2');
const contentDocsDir = path.resolve('src/content/docs');

// Clean up old directories
for (const old of ['card', 'carousel', 'footer', 'header', 'productlist', 'components', 'blocks', 'pages']) {
  const p = path.join(contentDocsDir, old);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
  }
}

// Ensure directory exists
fs.mkdirSync(path.join(contentDocsDir, 'guides'), { recursive: true });

// 1. Get component JavaScript source code (Standalone Web Component, no base.js)
function getComponentJsCode(entry) {
  const dir = path.join(storybook2Dir, 'src/components', entry.id);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'mobile.js');
  const blocks = [];

  for (const f of files) {
    const code = fs.readFileSync(path.join(dir, f), 'utf8');
    blocks.push(code.trim());
  }

  return blocks.join('\n\n');
}

// 2. Extract component-specific CSS styles (if any)
function getComponentCssCode(entry) {
  const dir = path.join(storybook2Dir, 'src/components', entry.id);
  const cssFiles = fs.readdirSync(dir).filter(f => f.endsWith('.css'));
  if (cssFiles.length === 0) return '';
  const blocks = [];
  for (const f of cssFiles) {
    const code = fs.readFileSync(path.join(dir, f), 'utf8');
    if (code.trim()) blocks.push(code.trim());
  }
  return blocks.join('\n\n');
}

// 3. Extract HTML markup fragment
function getComponentHtmlCode(entry) {
  const genericTag = (entry.kind || entry.name.split('-')[0]).toLowerCase();
  const htmlFile = path.join(storybook2Dir, `public/code/${entry.id}-responsive.html`);
  if (fs.existsSync(htmlFile)) {
    const content = fs.readFileSync(htmlFile, 'utf8');
    const bodyMatch = content.match(/<body>([\s\S]*?)<script>/);
    if (bodyMatch) {
      let markup = bodyMatch[1].trim();
      // Present generic tag without '-01' in HTML code block
      markup = markup.replaceAll(`<${entry.id}`, `<${genericTag}`).replaceAll(`</${entry.id}>`, `</${genericTag}>`);
      return markup;
    }
  }
  return `<${genericTag}></${genericTag}>`;
}

// Escape curly braces in Markdown for MDX compatibility
function escapeMdxText(text) {
  return text.replace(/([^\`\n]|^)\{([^}\n]+)\}([^\`\n]|$)/g, '$1`{$2}`$3');
}

// 3. Generate 3-level component documents: components|blocks / Kind / component-id
for (const entry of catalog) {
  const level1 = (entry.group || 'Components').toLowerCase();
  const level2 = (entry.kind || entry.name.split('-')[0]).toLowerCase();
  const targetDir = path.join(contentDocsDir, level1, level2);
  fs.mkdirSync(targetDir, { recursive: true });

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
  if (entry.id.startsWith('header-')) previewHeight = '280px';
  else if (entry.id.startsWith('footer-')) previewHeight = '400px';
  else if (entry.id.startsWith('carousel-')) previewHeight = '620px';
  else if (entry.id.startsWith('productlist-')) previewHeight = '550px';

  let mdx = `---
title: ${entry.name}
description: ${entry.name} Component specification, interactive sandbox, and source code.
---

import ComponentPreview from '../../../../components/ComponentPreview.astro';
import { Tabs, TabItem } from '@astrojs/starlight/components';

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

## Source Code

<Tabs>
  <TabItem label="JavaScript">

\`\`\`javascript title="${entry.name} JavaScript Web Component"
${jsCode.trim()}
\`\`\`

  </TabItem>
  <TabItem label="HTML">

\`\`\`html title="${entry.name} HTML"
${htmlCode.trim()}
\`\`\`

  </TabItem>${cssCode ? `
  <TabItem label="CSS">

\`\`\`css title="${entry.name} Styles"
${cssCode.trim()}
\`\`\`

  </TabItem>` : ''}
</Tabs>
`;

  fs.writeFileSync(path.join(targetDir, `${entry.id}.mdx`), mdx, 'utf8');
  console.log(`Generated doc: ${level1}/${level2}/${entry.id}.mdx`);
}

// 4. Generate index.mdx
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
  <Card title="Storybook 8 Design System" icon="star">
    Restores Storybook 8 Explorer tree navigation, gray sidebars, active badges, minimalist toolbars, and collapsible code drawers.
  </Card>
  <Card title="Clear Source Code Tabs" icon="open-book">
    Separately displays JavaScript source, HTML markup structure, and CSS / Tailwind styling.
  </Card>
  <Card title="Interactive Pure-White Sandbox" icon="laptop">
    Live preview sandbox with instant Desktop (100%), Tablet (768px), and Mobile (390px) viewport switching.
  </Card>
</CardGrid>

## Catalog Index

| Group | Kind | Component ID | Component Name | Custom Element Tag | Document Link |
| --- | --- | --- | --- | --- | --- |
${catalog.map(c => {
  const level1 = (c.group || 'Components').toLowerCase();
  const level2 = (c.kind || c.name.split('-')[0]).toLowerCase();
  return `| **${c.group || 'Components'}** | **${c.kind || c.name.split('-')[0]}** | \`${c.id}\` | **${c.name}** | \`<${c.tag}>\` | [Open Document](/${level1}/${level2}/${c.id}/) |`;
}).join('\n')}
`;

fs.writeFileSync(path.join(contentDocsDir, 'index.mdx'), indexMdx, 'utf8');

// 5. Generate guides/theme.mdx
const themeJs = fs.readFileSync(path.join(storybook2Dir, 'src/config/theme.js'), 'utf8');
const resourcesJs = fs.readFileSync(path.join(storybook2Dir, 'src/config/resources.js'), 'utf8');
const skeletonJs = fs.readFileSync(path.join(storybook2Dir, 'src/components/skeleton.js'), 'utf8');
const markupJs = fs.readFileSync(path.join(storybook2Dir, 'src/components/shared/markup.js'), 'utf8');

const themeMdx = `---
title: Theme & Foundation Specifications
description: Storybook2 theme configuration, resource links, and foundation skeleton source.
---

## Theme Configuration (theme.js)

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
console.log('All documents generated successfully!');
