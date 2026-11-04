import { initializeResources } from '../index.js';
import { catalog } from '../catalog.js';
import { componentRuntimes } from '../generated/examples.js';
import { createDocument } from '../export-document.js';
import { defaults, normalizeState, validateProps } from './schema.js';

await initializeResources();
const storageKey = 'component-playground.layout.v1';
const sample = { items: ['header-01', 'carousel-01', 'productlist-01', 'footer-01'].map((id, index) => ({ key: `item-${index + 1}`, id, props: defaults[id] })), contentWidth: 1200, viewportWidth: 1440, preset: 'default' };
let state;
try { state = normalizeState(JSON.parse(localStorage.getItem(storageKey) || 'null') || sample); } catch { state = normalizeState(sample); }
let selected = state.items[0]?.key;
let sequence = Math.max(0, ...state.items.map(item => Number(item.key.match(/\d+/)?.[0]) || 0));
const preview = document.querySelector('#preview');
const status = message => { document.querySelector('#status').textContent = message; };
const nameOf = id => catalog.find(entry => entry.id === id)?.name || id;
const button = (label, action, value, style = '') => {
  const node = document.createElement('button'); node.type = 'button'; node.textContent = label;
  node.dataset.action = action; node.dataset.value = value;
  node.className = `rounded-md border border-outline px-2 py-2 text-xs hover:bg-accent/30 ${style}`;
  return node;
};

function sendPreview() { preview.contentWindow?.postMessage({ type: 'playground:render', state }, location.origin); }
function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { status('浏览器无法保存，当前组合仍可使用和导出。'); }
  sendPreview();
}
function inspector() {
  const item = state.items.find(item => item.key === selected);
  document.querySelector('#selected-title').textContent = item ? `${nameOf(item.id)} 属性` : '组件属性';
  document.querySelector('#properties').value = item ? JSON.stringify(item.props, null, 2) : '{}';
  document.querySelector('#properties').disabled = !item;
  document.querySelector('#apply').disabled = !item;
}
function renderList() {
  const list = document.querySelector('#sequence'); list.replaceChildren();
  state.items.forEach((item, index) => {
    const row = document.createElement('li'); row.className = `rounded-lg border p-2 ${item.key === selected ? 'border-primary bg-accent/20' : 'border-outline'}`;
    const choose = button(`${index + 1}. ${nameOf(item.id)}`, 'select', item.key, 'mb-2 w-full border-0 text-left font-medium');
    const controls = document.createElement('div'); controls.className = 'flex gap-1';
    for (const [label, action] of [['上移', 'up'], ['下移', 'down'], ['删除', 'remove']]) {
      const node = button(label, action, item.key);
      node.setAttribute('aria-label', `${label} ${nameOf(item.id)} 第${index + 1}项`);
      if (action === 'up' && index === 0 || action === 'down' && index === state.items.length - 1) node.disabled = true;
      controls.append(node);
    }
    row.append(choose, controls); list.append(row);
  });
  if (!state.items.length) { const empty = document.createElement('li'); empty.className = 'py-6 text-sm text-muted'; empty.textContent = '从上方添加组件或板块'; list.append(empty); }
  inspector();
}
function controls() {
  document.querySelector('#viewport-width').value = String(state.viewportWidth);
  document.querySelector('#content-width').value = String(state.contentWidth);
  document.querySelector('#theme').value = state.preset;
  preview.style.width = `${state.viewportWidth}px`;
}

for (const entry of catalog) {
  const add = button(`＋ ${entry.name}`, 'add', entry.id, 'text-left');
  add.setAttribute('aria-label', `添加 ${entry.name}`);
  document.querySelector('#palette').append(add);
}
document.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const { action, value } = target.dataset;
  if (action === 'add') {
    if (state.items.length >= 50) return status('最多组合50个条目。');
    const item = { key: `item-${++sequence}`, id: value, props: structuredClone(defaults[value] || {}) };
    state.items.push(item); selected = item.key;
  } else if (action === 'select') { selected = value; renderList(); return; }
  else {
    const index = state.items.findIndex(item => item.key === value);
    if (index < 0) return;
    if (action === 'remove') { state.items.splice(index, 1); if (selected === value) selected = state.items[Math.min(index, state.items.length - 1)]?.key; }
    if (action === 'up' && index > 0) [state.items[index - 1], state.items[index]] = [state.items[index], state.items[index - 1]];
    if (action === 'down' && index < state.items.length - 1) [state.items[index], state.items[index + 1]] = [state.items[index + 1], state.items[index]];
  }
  renderList(); save(); status(`当前组合 ${state.items.length} 项，已保存到本机。`);
});
for (const [id, property] of [['viewport-width', 'viewportWidth'], ['content-width', 'contentWidth']]) document.querySelector(`#${id}`).addEventListener('change', event => {
  const value = Number(event.target.value);
  if (!Number.isFinite(value) || value < 320 || value > 2560) { controls(); return status('宽度应为320–2560px。'); }
  state[property] = Math.round(value); controls(); save();
});
document.querySelector('#theme').addEventListener('change', event => { state.preset = event.target.value; save(); });
document.querySelectorAll('[data-width]').forEach(node => node.addEventListener('click', () => { state.viewportWidth = Number(node.dataset.width); controls(); save(); }));
document.querySelector('#apply').addEventListener('click', () => {
  const item = state.items.find(item => item.key === selected);
  if (!item) return;
  try { item.props = validateProps(item.id, JSON.parse(document.querySelector('#properties').value)); save(); status('组件属性已应用。'); }
  catch (error) { status(error.message); }
});
document.querySelector('#clear').addEventListener('click', () => { state.items = []; selected = undefined; renderList(); save(); status('组合已清空。'); });
preview.addEventListener('load', sendPreview);

const dialog = document.querySelector('#code-dialog');
document.querySelector('#export').addEventListener('click', () => {
  document.querySelector('#code-output').value = createDocument(state.items, componentRuntimes, { contentWidth: state.contentWidth, preset: state.preset });
  document.querySelector('#copy-status').textContent = '包含实际组件实现、图文骨架、主题、响应式分支及当前组合顺序，无项目脚本依赖。';
  dialog.showModal();
});
document.querySelector('#close-code').addEventListener('click', () => dialog.close());
document.querySelector('#copy').addEventListener('click', async () => {
  const output = document.querySelector('#code-output');
  try { await navigator.clipboard.writeText(output.value); document.querySelector('#copy-status').textContent = '完整HTML已复制。'; }
  catch { output.focus(); output.select(); document.querySelector('#copy-status').textContent = '请按 Ctrl+C 复制选中的完整代码。'; }
});
document.querySelector('#download').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([document.querySelector('#code-output').value], { type: 'text/html;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'composition.html'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
controls(); renderList(); save();
document.documentElement.dataset.playgroundReady = 'true';
