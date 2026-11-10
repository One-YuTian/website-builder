#!/usr/bin/env node

/**
 * 3-Level Progressive Disclosure Template Reader for Website Builder Skill.
 * Prevents context blowout by returning templates strictly in three progressive levels:
 * - Level 1: list       -> Returns catalog list with 1-sentence summaries.
 * - Level 2: doc <id>   -> Returns ## Overview (layout, dimensions, attributes, events).
 * - Level 3: code <id>  -> Returns ## Code (HTML, JavaScript, CSS).
 * - Utility: select     -> Lists unranked candidates for Agent-led visual design.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.resolve(__dirname, '../templates');

// Helper to index all templates
function indexTemplates() {
  const index = new Map();
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.txt')) {
        const id = entry.name.replace(/\.txt$/, '');
        const rel = path.relative(templatesDir, fullPath).replace(/\\/g, '/');
        const parts = rel.split('/');
        const group = parts[0] || 'components';
        const category = parts[1] || id.split('-')[0];
        index.set(id.toLowerCase(), { id, path: fullPath, group, category });
      }
    }
  }
  walk(templatesDir);
  return index;
}

const templates = indexTemplates();

function parseTemplate(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const sections = {
    overview: '',
    html: '',
    js: '',
    css: ''
  };

  const overviewMatch = content.match(/## Overview([\s\S]*?)(?=## Code|$)/);
  if (overviewMatch) sections.overview = overviewMatch[1].trim();

  const codeSectionMatch = content.match(/## Code([\s\S]*$)/);
  const codeContent = codeSectionMatch ? codeSectionMatch[1] : '';

  const htmlMatch = codeContent.match(/### HTML\s*```html([\s\S]*?)```/);
  if (htmlMatch) sections.html = htmlMatch[1].trim();

  const jsMatch = codeContent.match(/### JavaScript\s*```javascript([\s\S]*?)```/);
  if (jsMatch) sections.js = jsMatch[1].trim();

  const cssMatch = codeContent.match(/### CSS\s*```css([\s\S]*?)```/);
  if (cssMatch) sections.css = cssMatch[1].trim();

  return sections;
}

const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
  case 'list': {
    const filter = args[1]?.toLowerCase();
    const rows = [];
    for (const [id, meta] of templates.entries()) {
      if (filter && !meta.group.includes(filter) && !meta.category.includes(filter) && !id.includes(filter)) {
        continue;
      }
      const parsed = parseTemplate(meta.path);
      const firstLine = parsed.overview.split('\n').find(l => l.trim().length > 0 && !l.startsWith('#')) || '';
      const summary = firstLine.length > 90 ? firstLine.slice(0, 87) + '...' : firstLine;
      rows.push({
        id: meta.id,
        group: meta.group,
        category: meta.category,
        summary
      });
    }

    console.log(`\n=== Available Component Templates (${rows.length} total) ===\n`);
    console.log('| ID | Group | Category | Summary |');
    console.log('| --- | --- | --- | --- |');
    for (const r of rows) {
      console.log(`| \`${r.id}\` | ${r.group} | ${r.category} | ${r.summary} |`);
    }
    console.log('\nUse "node scripts/read-template.mjs doc <id>" to view Level 2 specification.');
    break;
  }

  case 'doc': {
    const id = args[1]?.toLowerCase();
    if (!id || !templates.has(id)) {
      console.error(`Error: Component template "${id}" not found.`);
      process.exit(1);
    }
    const meta = templates.get(id);
    const parsed = parseTemplate(meta.path);
    console.log(`\n# Specification: ${meta.id} (${meta.group} > ${meta.category})\n`);
    console.log(parsed.overview);
    console.log('\n---\nUse "node scripts/read-template.mjs code ' + meta.id + ' [html|js|css]" to view Level 3 implementation code.');
    break;
  }

  case 'code': {
    const id = args[1]?.toLowerCase();
    const type = args[2]?.toLowerCase() || 'all';
    if (!id || !templates.has(id)) {
      console.error(`Error: Component template "${id}" not found.`);
      process.exit(1);
    }
    const meta = templates.get(id);
    const parsed = parseTemplate(meta.path);

    const htmlComment = `<!-- Source Template: ${meta.id} (${meta.group} > ${meta.category}) -->\n`;
    const jsComment = `// Source Template: ${meta.id} (${meta.group} > ${meta.category})\n`;

    if (type === 'html') {
      console.log(htmlComment + parsed.html);
    } else if (type === 'js' || type === 'javascript') {
      console.log(jsComment + parsed.js);
    } else if (type === 'css') {
      console.log(`/* Source Template: ${meta.id} (${meta.group} > ${meta.category}) */\n` + (parsed.css || '/* No custom CSS required; styled with Tailwind CSS classes */'));
    } else {
      console.log(`\n/* ==================== HTML: ${meta.id} ==================== */\n`);
      console.log(htmlComment + parsed.html);
      console.log(`\n/* ================= JavaScript: ${meta.id} ================= */\n`);
      console.log(jsComment + parsed.js);
      if (parsed.css) {
        console.log(`\n/* ==================== CSS: ${meta.id} ==================== */\n`);
        console.log(parsed.css);
      }
    }
    break;
  }

  case 'select': {
    const catalog = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../catalog.json'), 'utf8'));
    const categories = [...new Set(catalog.map(item => item.category))];
    console.log(JSON.stringify({
      selection: 'Unranked candidates. Agent must decide brand palette, light/dark strategy, content widths and compatible layout before choosing templates. Use only needed sections; -01 is valid. No automatic or random theme/layout selection.',
      categories: categories.map(category => ({
        category,
        candidates: catalog.filter(item => item.category === category).map(({ id, summary }) => ({ id, summary }))
      }))
    }, null, 2));
    break;
  }

  default:
    console.log(`
Website Builder Progressive Disclosure CLI

Commands:
  node scripts/read-template.mjs list [filter]
    Level 1: Display component catalog with summaries (e.g. list header, list blocks)

  node scripts/read-template.mjs doc <id>
    Level 2: Display component specification and interface attributes (e.g. doc header-01)

  node scripts/read-template.mjs code <id> [html|js|css]
    Level 3: Display raw source code for component (e.g. code header-01 js)

  node scripts/read-template.mjs select
    List candidates; Agent decides the visual system and compatible composition
`);
    break;
}
