import { createSkeleton } from './index.js';

/** 基础能力演示，不是已迁移业务组件。 */
export function foundationDemo(doc = document) {
  const root = doc.createElement('section');
  root.dataset.sb2Demo = '';
  root.className = 'grid min-w-0 gap-6 sm:grid-cols-2';
  const media = createSkeleton({ kind: 'image', ratio: '4/3' }, doc);
  media.dataset.region = 'media';
  const content = doc.createElement('div');
  content.className = 'flex min-w-0 flex-col items-start gap-5';
  content.append(createSkeleton({ kind: 'circle' }, doc), createSkeleton({ kind: 'title', fontSize: '32px' }, doc), createSkeleton({ kind: 'text', fontSize: '16px', lines: 3 }, doc));
  content.querySelectorAll('skeleton-placeholder').forEach(element => element.classList.add('w-full'));
  const button = doc.createElement('button');
  button.type = 'button';
  button.className = 'rounded-lg border border-outline p-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary';
  button.setAttribute('aria-label', '切换骨架圆角');
  button.dataset.active = 'false';
  button.append(createSkeleton({ kind: 'button', fontSize: '14px' }, doc));
  button.addEventListener('click', () => {
    const active = button.dataset.active !== 'true';
    button.dataset.active = String(active);
    button.setAttribute('aria-pressed', String(active));
    media.setAttribute('radius', active ? '32px' : '12px');
  });
  button.setAttribute('aria-pressed', 'false');
  content.append(button);
  root.append(media, content);
  return root;
}
