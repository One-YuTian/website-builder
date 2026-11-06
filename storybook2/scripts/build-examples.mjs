import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { catalog } from '../src/catalog.js';
import { createDocument } from '../src/export-document.js';
import { defaults } from '../src/playground/schema.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const modulePath = path => `${root}${path}`.replaceAll('\\', '/');
await fs.mkdir(new URL('../public/code/', import.meta.url), { recursive: true });
await fs.mkdir(new URL('../src/generated/', import.meta.url), { recursive: true });
const snippets = {};
const runtimes = {};
async function runtimeFor(entry, variant) {
  const definitions = [['skeleton-placeholder', 'Skeleton', 'src/components/skeleton.js']];
  const isBlock = entry.group === 'Blocks' || entry.group === 'Pages';

  // Blocks and Pages need card-01 definition for productlist, shop, and detail
  if (entry.id.startsWith('productlist') || entry.id.startsWith('shop') || entry.id.startsWith('detail')) {
    definitions.push(['card-01', 'Card', 'src/components/card-01/index.js']);
  }
  if (entry.id.startsWith('flashsale')) {
    definitions.push(['flashcard-01', 'FlashCard', 'src/components/flashcard-01/index.js']);
  } else if (!isBlock && entry.id !== 'skeleton-placeholder') {
    // Normal WebComponent
    const implName = entry.kind || 'Component';
    definitions.push([entry.id, implName, `src/components/${entry.id}/index.js`]);
  }

  let blockScript = '';
  if (isBlock) {
    blockScript = await fs.readFile(new URL(`../src/components/${entry.id}/index.js`, import.meta.url), 'utf8');
  }

  // Deduplicate imports by name
  const uniqueImports = new Map();
  for (const [, name, path] of definitions) {
    if (!uniqueImports.has(name)) {
      uniqueImports.set(name, `import { ${name} } from ${JSON.stringify(modulePath(path))};`);
    }
  }
  const imports = Array.from(uniqueImports.values()).join('\n');
  const customElementsDef = definitions.map(([tag, name]) => `[${JSON.stringify(tag)},${name}]`).join(',');
  const source = `${imports}\nimport { initializeResources, loadJQuery, loadSwiper } from ${JSON.stringify(modulePath('src/runtime/resources.js'))};\nfor (const [tag, implementation] of [${customElementsDef}]) if (!customElements.get(tag)) customElements.define(tag, implementation);\nPromise.all([initializeResources(), loadJQuery(), loadSwiper()]).then(([result, $, Swiper]) => {\n  document.documentElement.dataset.exampleReady = String(result.ready);\n  const eventKey = Symbol.for('components.demo.events');\n  if (!document[eventKey]) {\n    document[eventKey] = true;\n    $(document).on('product-navigate footer-navigate header-navigate carousel-navigate', function(event) { console.log(event.originalEvent.detail); });\n  }\n  ${blockScript}\n}).catch(() => { document.documentElement.dataset.exampleReady = 'false'; });`;

  const result = await build({ configFile: false, root, publicDir: false, logLevel: 'silent', plugins: [{ name: 'inline-component-example', resolveId(id) { if (id.endsWith('component-example')) return '\0component-example'; }, load(id) { if (id === '\0component-example') return source; } }], build: { write: false, minify: false, target: 'es2022', lib: { entry: 'component-example', name: 'ComponentExample', formats: ['iife'] } } });
  return (Array.isArray(result) ? result : [result]).flatMap(item => item.output).find(item => item.type === 'chunk').code;
}

for (const entry of [...catalog, { id: 'skeleton-placeholder', name: 'Skeleton' }]) {
  const paired = false;
  const desktopRuntime = await runtimeFor(entry, 'desktop');
  const mobileRuntime = desktopRuntime;
  const responsiveRuntime = desktopRuntime;
  runtimes[entry.id] = responsiveRuntime;
  const props = defaults[entry.id] || {};

  const isBlock = entry.group === 'Blocks' || entry.group === 'Pages';
  // Blocks and Pages use raw template.html directly in iframe; atomic Components use WebComponents
  let customHtml = '';
  if (isBlock) {
    try {
      customHtml = await fs.readFile(new URL(`../src/components/${entry.id}/template.html`, import.meta.url), 'utf8');
    } catch (e) {
      customHtml = '';
    }
  }

  const desktop = createDocument([{ id: entry.id, props, customHtml }], { [entry.id]: desktopRuntime }, { title: entry.name, device: 'desktop' });
  const mobileTag = `${entry.id}-mobile`;
  const mobile = paired ? createDocument([{ id: mobileTag, props, customHtml }], { [mobileTag]: mobileRuntime }, { title: `${entry.name} 小屏适配` }) : desktop;
  const responsive = createDocument([{ id: entry.id, props, customHtml }], { [entry.id]: responsiveRuntime }, { title: `${entry.name} 响应式组合` });
  snippets[entry.id] = { desktop, mobile, responsive };
  for (const [name, content] of Object.entries(snippets[entry.id])) await fs.writeFile(new URL(`../public/code/${entry.id}-${name}.html`, import.meta.url), content);
}
await fs.writeFile(new URL('../src/generated/examples.js', import.meta.url), `// 自动从组件源码生成，不手工编辑。\nexport const codeSnippets = ${JSON.stringify(snippets)};\nexport const componentRuntimes = ${JSON.stringify(runtimes)};\n`);
console.log(`已生成 ${catalog.length} 个条目的完整HTML代码，含独立移动与响应式组合。`);
