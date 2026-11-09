import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { resources } from '../src/config/resources.js';
import { catalog } from '../src/catalog.js';
import { parse } from 'acorn';
import { themeConfig } from '../src/config/theme.js';

const root = fileURLToPath(new URL('../', import.meta.url));
async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.filter(entry => entry.name !== 'generated').map(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : path.join(directory, entry.name)))).flat();
}
const files = await walk(path.join(root, 'src'));
const errors = [];
for (const file of files) {
  const source = await fs.readFile(file, 'utf8');
  const relative = path.relative(root, file);
  if (/\/(?:vendor|source|templates)\/|(?:\.\.\/)+storybook\//.test(source)) errors.push(`${relative}: 禁止原站资源和 vendor 引用`);
  if (file.endsWith('.js')) {
    const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
    const imports = [];
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration', 'ImportExpression'].includes(node.type) && node.source) {
        if (typeof node.source.value === 'string') imports.push(node.source.value);
        else errors.push(`${relative}: 禁止无法静态验证的动态导入`);
      }
      for (const value of Object.values(node)) {
        if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === 'object') visit(value);
      }
    }
    visit(ast);
    for (const specifier of imports) {
      if (!specifier.startsWith('.')) errors.push(`${relative}: 运行代码只能相对导入本地模块：${specifier}`);
      else {
        try { await fs.access(path.resolve(path.dirname(file), specifier.replace(/\?raw$/, ''))); }
        catch { errors.push(`${relative}: 导入不存在：${specifier}`); }
      }
    }
  }
  if (file.endsWith('.js') && !file.endsWith(path.join('config', 'resources.js')) && /https?:\/\//.test(source)) errors.push(`${relative}: 运行资源 URL 必须集中在资源配置`);
  if (relative.includes(`${path.sep}components${path.sep}`) && /<(?:img|picture|svg|canvas)\b|background-image\s*:|url\s*\(|attachShadow\s*\(|<iframe\b/i.test(source)) errors.push(`${relative}: 组件只能使用骨架与 Light DOM`);
}
for (const [name, url] of Object.entries(resources)) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') errors.push(`${name}: CDN 必须为 HTTPS`);
  if (name === 'font') {
    if (parsed.hostname !== 'fonts.googleapis.com' || !parsed.searchParams.get('family')?.startsWith(`${themeConfig.font.family}:`)) errors.push('字体必须由全局 Google Font 配置生成');
  } else if (!/@\d+\.\d+\.\d+(?:\/|$)/.test(url)) errors.push(`${name}: CDN 必须固定完整版本`);
}
const ids = new Set();
for (const entry of catalog) {
  assert.match(entry.id, /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*-(?:0[1-9]|[1-9]\d+)$/, '业务组件 ID 必须使用至少两位正整数编号，如 header-01');
  assert.match(entry.name, /^[A-Z][A-Za-z0-9]*-(?:0[1-9]|[1-9]\d+)$/, '组件名必须使用类型名及至少两位编号，如 Header-01');
  assert.equal(entry.tag, entry.id, '业务组件标签直接使用稳定 ID，不添加项目前缀');
  assert.ok(entry.id && entry.tag && entry.source, '目录条目必须有 id、tag、source 路径');
  assert.ok(!ids.has(entry.id), `重复目录 ID：${entry.id}`);
  ids.add(entry.id);
  const metadataPath = path.resolve(root, entry.source);
  assert.ok(metadataPath.startsWith(path.join(root, 'src', 'components') + path.sep), 'source 必须在组件目录内');
  const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
  assert.equal(metadata.id, entry.id, '来源记录的 ID 必须匹配目录');
  assert.equal(metadata.name, entry.name, '来源记录的组件名必须匹配目录');
  assert.equal(metadata.acceptance?.status, 'passed', '只有实际验收通过的组件可加入目录');
  for (const key of ['id', 'originalId', 'site', 'page', 'target', 'retainedLayout', 'retainedInteractions', 'removed', 'acceptance']) assert.ok(metadata[key], `${entry.id}: 缺少 ${key}`);
  const readme = await fs.readFile(path.join(path.dirname(metadataPath), 'README.md'), 'utf8');
  assert.ok(!/__[^\n]+__/.test(JSON.stringify(metadata) + readme), `${entry.id}: 未填写模板占位符`);
  for (const term of ['区域', '尺寸', '属性', '事件']) assert.ok(readme.includes(term), `${entry.id}: 文档缺少 ${term}`);
  assert.ok(!/## 来源与重写|## 验收|```\w*\s*\nimport\b/.test(readme), `${entry.id}: Doc 仅描述组件自身，示例不能使用 import`);
  assert.ok(metadata.acceptance.date && metadata.acceptance.results?.length, `${entry.id}: 缺少实际验收记录`);
}
assert.ok(Number.isFinite(themeConfig.contentMaxWidth) && themeConfig.contentMaxWidth > 0, '内容宽度必须为正数');
assert.ok(Number.isFinite(themeConfig.radius) && themeConfig.radius >= 0, '圆角必须为非负数');
assert.ok(Number.isFinite(themeConfig.skeletonTextSizeOffset) && themeConfig.skeletonTextSizeOffset >= 0, '文字骨架偏移必须是非负数');
const points = Object.values(themeConfig.breakpoints);
assert.ok(points.every((value, index) => Number.isFinite(value) && value > (points[index - 1] || 0)), '全局断点必须递增');
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
assert.ok(!Object.keys(pkg.dependencies || {}).length, '运行依赖不能通过 npm 安装');
for (const [name, version] of Object.entries(pkg.devDependencies)) assert.match(version, /^\d+\.\d+\.\d+$/, `${name} 必须锁定版本`);
if (errors.length) throw new Error(errors.join('\n'));
console.log(`静态检查通过：${files.length} 个源文件；已验收业务组件 ${catalog.length} 个。`);
