import { initializeResources, registerComponents, applyTheme } from '../index.js';
import { createPreviewItem } from '../preview-items.js';
import { normalizeState } from './schema.js';

registerComponents();
const ready = initializeResources();
const nodes = new Map();
window.addEventListener('message', async event => {
  if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'playground:render') return;
  const state = normalizeState(event.data.state);
  await ready;
  applyTheme({ preset: state.preset, contentMaxWidth: state.contentWidth });
  const canvas = document.querySelector('#canvas');
  const desired = new Set(state.items.map(item => item.key));
  for (const [key, saved] of nodes) if (!desired.has(key)) { saved.node.remove(); nodes.delete(key); }
  state.items.forEach((item, index) => {
    let saved = nodes.get(item.key);
    if (!saved || saved.id !== item.id || saved.signature !== JSON.stringify(item.props)) {
      saved?.node.remove();
      const node = createPreviewItem(item.id, item.props);
      node.dataset.playgroundKey = item.key;
      if (item.id === 'card-01') {
        const frame = document.createElement('div'); frame.className = 'content-container py-6';
        node.firstElementChild.classList.add('w-full', item.props.viewMode === 'list' ? 'max-w-3xl' : 'max-w-sm'); frame.append(node.firstElementChild); node.append(frame);
      }
      node.addEventListener('header-search-input', event => { event.target.searchSuggestions = event.detail.query.length >= 2 ? [{ id: 'demo-product-1' }] : []; });
      saved = { node, id: item.id, signature: JSON.stringify(item.props) }; nodes.set(item.key, saved);
    }
    if (canvas.children[index] !== saved.node) canvas.insertBefore(saved.node, canvas.children[index] || null);
  });
  document.documentElement.dataset.previewReady = 'true';
});
