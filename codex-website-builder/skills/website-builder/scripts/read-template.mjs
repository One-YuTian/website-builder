#!/usr/bin/env node

/**
 * 3-Level Progressive Disclosure Template Reader for Website Builder Skill.
 * Prevents context blowout by returning templates strictly in three progressive levels:
 * - Level 1: list       -> Returns catalog list with 1-sentence summaries.
 * - Level 2: doc <id>   -> Returns ## Overview (layout, dimensions, attributes, events).
 * - Level 3: code <id>  -> Returns ## Code (HTML, JavaScript, CSS).
 * - Utility: select     -> Algorithmically selects or randomly samples component combinations for a page.
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
    const page = (args.find(a => a.startsWith('--page=')) || '').replace('--page=', '') || 'home';
    const requestedTheme = (args.find(a => a.startsWith('--theme=')) || '').replace('--theme=', '');
    const requestedLayout = (args.find(a => a.startsWith('--layout=')) || '').replace('--layout=', '');
    const isRandom = args.includes('--random') || (!args.some(a => a.startsWith('--page=')) && !requestedTheme);

    // Theme Palettes & Design System Presets
    const themePalettes = {
      'indigo': {
        name: 'Modern Tech & SaaS (Indigo)',
        primary: '#4f46e5',
        accent: '#eef2ff',
        surface: '#ffffff',
        content: '#0f172a',
        muted: '#64748b',
        outline: '#e2e8f0',
        contentMaxWidth: '1280px',
        radii: { sm: '4px', md: '8px', lg: '12px', xl: '16px' },
        vibe: 'Sharp, modern, high-tech, crisp'
      },
      'emerald': {
        name: 'Organic & Outdoor (Emerald)',
        primary: '#059669',
        accent: '#ecfdf5',
        surface: '#ffffff',
        content: '#064e3b',
        muted: '#6b7280',
        outline: '#d1fae5',
        contentMaxWidth: '1200px',
        radii: { sm: '6px', md: '10px', lg: '16px', xl: '24px' },
        vibe: 'Warm, natural, eco-friendly, soft'
      },
      'mono': {
        name: 'Editorial Luxury & Minimal (Zinc/Mono)',
        primary: '#18181b',
        accent: '#f4f4f5',
        surface: '#ffffff',
        content: '#09090b',
        muted: '#71717a',
        outline: '#e4e4e7',
        contentMaxWidth: '1400px',
        radii: { sm: '0px', md: '2px', lg: '4px', xl: '6px' },
        vibe: 'High fashion, architectural, sharp geometric'
      },
      'rose': {
        name: 'Glamour & Lifestyle (Rose)',
        primary: '#e11d48',
        accent: '#fff1f2',
        surface: '#ffffff',
        content: '#1e293b',
        muted: '#64748b',
        outline: '#ffe4e6',
        contentMaxWidth: '1240px',
        radii: { sm: '8px', md: '12px', lg: '20px', xl: '32px' },
        vibe: 'Youthful, vibrant, friendly, curved'
      },
      'amber': {
        name: 'Artisan & Vintage (Amber Bronze)',
        primary: '#d97706',
        accent: '#fef3c7',
        surface: '#ffffff',
        content: '#1c1917',
        muted: '#78716c',
        outline: '#e7e5e4',
        contentMaxWidth: '1200px',
        radii: { sm: '4px', md: '6px', lg: '10px', xl: '14px' },
        vibe: 'Handcrafted, classic, heritage, trustworthy'
      }
    };

    const themeKeys = Object.keys(themePalettes);
    const activeThemeKey = requestedTheme && themePalettes[requestedTheme]
      ? requestedTheme
      : themeKeys[Math.floor(Math.random() * themeKeys.length)];
    const activeTheme = themePalettes[activeThemeKey];

    // Homepage Layout Archetypes
    const homeLayouts = {
      pulse: {
        name: 'Pulse & Flash Sale Focus (Fast-paced promotion & countdown)',
        slots: ['header', 'carousel', 'flashsale', 'productlist', 'categories', 'promotion', 'services', 'footer']
      },
      editorial: {
        name: 'Editorial & Brand Narrative (Magazine style storytelling)',
        slots: ['header', 'carousel', 'promotion', 'categories', 'productlist', 'services', 'footer']
      },
      discovery: {
        name: 'Catalog & Discovery Matrix (Category tiles upfront)',
        slots: ['header', 'categories', 'carousel', 'productlist', 'flashsale', 'services', 'footer']
      },
      clean: {
        name: 'Minimalist Boutique (Streamlined hero & curated shelf)',
        slots: ['header', 'carousel', 'productlist', 'promotion', 'services', 'footer']
      }
    };

    const layoutKeys = Object.keys(homeLayouts);
    const activeLayoutKey = requestedLayout && homeLayouts[requestedLayout]
      ? requestedLayout
      : (page === 'home' ? layoutKeys[Math.floor(Math.random() * layoutKeys.length)] : 'default');

    const otherPageSlots = {
      shop: ['header', 'shop', 'services', 'footer'],
      product: ['header', 'detail', 'services', 'footer'],
      cart: ['header', 'cart', 'footer'],
      wishlist: ['header', 'wishlist', 'footer'],
      checkout: ['header', 'checkout', 'footer'],
      login: ['header', 'login', 'footer'],
      register: ['header', 'register', 'footer'],
      about: ['header', 'about', 'services', 'footer'],
      contact: ['header', 'contact', 'footer']
    };

    const slots = page === 'home' ? homeLayouts[activeLayoutKey].slots : (otherPageSlots[page] || otherPageSlots.shop);

    // Filter and pick diverse non-01 templates
    const selected = [];
    for (const cat of slots) {
      const matches = Array.from(templates.values()).filter(t => t.category === cat);
      if (matches.length === 0) continue;

      let pick;
      if (isRandom || matches.length > 1) {
        // Exclude always picking the 0-th item (-01) when alternatives exist!
        const nonFirst = matches.slice(1);
        const pool = nonFirst.length > 0 ? nonFirst : matches;
        pick = pool[Math.floor(Math.random() * pool.length)];
      } else {
        pick = matches[0];
      }
      selected.push(pick);
    }

    console.log(`\n========================================================================`);
    console.log(`  WEBSITE BUILDER DIVERSE COMPOSITION: ${page.toUpperCase()}`);
    console.log(`========================================================================\n`);

    console.log(`### 1. Recommended Theme Palette: "${activeTheme.name}"`);
    console.log(`- Primary Color: ${activeTheme.primary} | Accent: ${activeTheme.accent} | Surface: ${activeTheme.surface}`);
    console.log(`- Content Max Width: ${activeTheme.contentMaxWidth} | Vibe: ${activeTheme.vibe}`);
    console.log(`- Radius Scale: sm: ${activeTheme.radii.sm}, md: ${activeTheme.radii.md}, lg: ${activeTheme.radii.lg}, xl: ${activeTheme.radii.xl}\n`);

    if (page === 'home') {
      console.log(`### 2. Selected Homepage Layout Archetype: "${homeLayouts[activeLayoutKey].name}"\n`);
    }

    console.log(`### 3. Diverse Template Slots (Strictly Non-Homogeneous):\n`);
    console.log('| Slot | Template ID | Category | Group | Source Retrieval Command |');
    console.log('| --- | --- | --- | --- | --- |');
    selected.forEach((s, idx) => {
      console.log(`| ${idx + 1}. ${s.category} | \`${s.id}\` | ${s.category} | ${s.group} | \`node scripts/read-template.mjs code ${s.id}\` |`);
    });

    console.log(`\n### 4. Code Snippet for app.js (Tailwind Config Integration):\n`);
    console.log('```javascript');
    console.log(`window.tailwind = window.tailwind || {};`);
    console.log(`window.tailwind.config = {`);
    console.log(`  theme: {`);
    console.log(`    extend: {`);
    console.log(`      colors: {`);
    console.log(`        primary: '${activeTheme.primary}',`);
    console.log(`        accent: '${activeTheme.accent}',`);
    console.log(`        surface: '${activeTheme.surface}',`);
    console.log(`        content: '${activeTheme.content}',`);
    console.log(`        muted: '${activeTheme.muted}',`);
    console.log(`        outline: '${activeTheme.outline}',`);
    console.log(`      },`);
    console.log(`      maxWidth: { content: '${activeTheme.contentMaxWidth}' },`);
    console.log(`      borderRadius: ${JSON.stringify(activeTheme.radii)}`);
    console.log(`    }`);
    console.log(`  }`);
    console.log(`};`);
    console.log('```\n');
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

  node scripts/read-template.mjs select --page=home [--random]
    Algorithmically select component composition for standard website pages
`);
    break;
}
