import { initializeResources, registerComponents } from './index.js';
import { foundationDemo } from './foundations.js';
import { catalog } from './catalog.js';
import { createPreviewItem } from './preview-items.js';

registerComponents();
registerComponents();
const first = initializeResources();
const second = initializeResources();
document.documentElement.dataset.sb2Idempotent = String(first === second);
const result = await first;
document.querySelector('#preview').append(foundationDemo());
const requested = new URLSearchParams(location.search).get('component');
const entry = catalog.find(component => component.id === requested);
if (entry) {
  const component = createPreviewItem(entry.tag);
  component.addEventListener('header-search-input', event => {
    event.target.searchSuggestions = event.detail.query.length >= 2 ? [{ id: 'demo-product-1' }] : [];
  });
  if (entry.id.startsWith('card-')) {
    const frame = document.createElement('div');
    frame.className = 'content-container py-6 flex justify-center';
    component.firstElementChild.classList.add('w-full', 'max-w-sm');
    frame.append(component);
    document.querySelector('#component-preview').append(frame);
  } else document.querySelector('#component-preview').append(component);
  document.querySelector('main').hidden = true;
  if (entry.id.startsWith('header-')) document.body.classList.add('min-h-[180vh]');
}
const list = document.querySelector('#components');
for (const component of catalog) {
  const link = document.createElement('a');
  link.href = `?component=${component.id}`;
  link.textContent = component.name;
  link.className = 'underline underline-offset-4';
  list.append(link);
}
document.querySelector('#status').textContent = result.ready ? `公共资源已就绪 · 业务组件迁移数：${catalog.length}` : '公共资源加载失败，请查看页面提示。';
document.documentElement.dataset.sb2Ready = String(result.ready);
