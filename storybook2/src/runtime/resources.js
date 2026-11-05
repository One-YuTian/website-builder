import { resources } from '../config/resources.js';
import { applyTheme, themeCss } from './theme.js';

const documents = new WeakMap();
const documentResourceKey = Symbol.for('components.resources.ready');
const jqueryDocuments = new WeakMap();
const jqueryResourceKey = Symbol.for('components.jquery.ready');
const swiperDocuments = new WeakMap();
const swiperResourceKey = Symbol.for('components.swiper.ready');

function loadAttempt(doc, tag, key, url) {
  return new Promise((resolve, reject) => {
    const element = doc.createElement(tag);
    element.dataset.sb2Resource = key;
    if (tag === 'script') element.src = url;
    else { element.rel = 'stylesheet'; element.href = url; }
    const timer = setTimeout(() => finish(new Error(`${key} 加载超时，请检查网络后刷新。`)), 8000);
    function finish(error) {
      clearTimeout(timer);
      element.onload = element.onerror = null;
      if (error) { element.remove(); reject(error); } else resolve();
    }
    element.onload = () => finish();
    element.onerror = () => finish(new Error(`${key} 加载失败，请检查 CDN 连接后刷新。`));
    doc.head.append(element);
  });
}

async function load(doc, tag, key, urls) {
  let failure;
  for (const url of urls) {
    try { await loadAttempt(doc, tag, key, url); return; }
    catch (error) { failure = error; }
  }
  throw failure;
}

function report(doc, message) {
  let alert = doc.querySelector('[data-sb2-resource-error]');
  if (!alert) {
    alert = doc.createElement('div');
    alert.dataset.sb2ResourceError = '';
    alert.setAttribute('role', 'alert');
    // CDN 不可用时也必须可读；这是唯一不依赖 Tailwind 的错误展示。
    alert.style.cssText = 'padding:16px;background:#fff1f2;color:#9f1239;font:14px system-ui;white-space:pre-wrap';
    (doc.body || doc.documentElement).prepend(alert);
  }
  alert.textContent = message;
}

/** 每个 Document 只初始化一次；失败通过 errors 和页面提示呈现，不静默降级。 */
export function initializeResources(doc = document) {
  if (doc[documentResourceKey]) return doc[documentResourceKey];
  if (documents.has(doc)) return documents.get(doc);
  applyTheme({}, doc);
  const fallback = doc.createElement('style');
  fallback.dataset.sb2Font = '';
  fallback.textContent = 'body { font-family: var(--theme-font); }';
  doc.head.append(fallback);
  const style = doc.createElement('style');
  style.type = 'text/tailwindcss';
  style.dataset.sb2Theme = '';
  style.textContent = themeCss;
  doc.head.append(style);
  const ready = Promise.allSettled([
    load(doc, 'script', 'Tailwind', [resources.tailwind, resources.tailwindFallback]),
    load(doc, 'link', 'Google Fonts', [resources.font]),
  ]).then(results => {
    const errors = results.filter(result => result.status === 'rejected').map(result => result.reason.message);
    if (errors.length) report(doc, errors.join('\n'));
    return { ready: errors.length === 0, errors };
  });
  documents.set(doc, ready);
  doc[documentResourceKey] = ready;
  return ready;
}

/** jQuery 仅在调用方需要 jQuery 示例/API 时按需从固定版本 CDN 加载。 */
export function loadJQuery(doc = document) {
  if (doc[jqueryResourceKey]) return doc[jqueryResourceKey];
  if (jqueryDocuments.has(doc)) return jqueryDocuments.get(doc);
  const ready = load(doc, 'script', 'jQuery', [resources.jquery, resources.jqueryFallback]).then(() => doc.defaultView.jQuery).catch(error => {
    report(doc, error.message);
    throw error;
  });
  jqueryDocuments.set(doc, ready);
  doc[jqueryResourceKey] = ready;
  return ready;
}

export function loadSwiper(doc = document) {
  if (doc[swiperResourceKey]) return doc[swiperResourceKey];
  if (swiperDocuments.has(doc)) return swiperDocuments.get(doc);
  const ready = Promise.all([
    load(doc, 'link', 'Swiper CSS', [resources.swiperCss, resources.swiperCssFallback]),
    load(doc, 'script', 'Swiper JS', [resources.swiper, resources.swiperFallback]),
  ]).then(() => doc.defaultView.Swiper).catch(error => {
    report(doc, error.message);
    throw error;
  });
  swiperDocuments.set(doc, ready);
  doc[swiperResourceKey] = ready;
  return ready;
}
