const shapes = {
  image: 'relative block w-full aspect-video overflow-hidden rounded-xl bg-accent',
  logo: 'relative flex h-10 w-32 items-center justify-center overflow-hidden rounded-xl bg-accent',
  text: 'block h-[0.75em] w-full rounded-sm bg-accent',
  title: 'block h-[0.75em] w-3/4 rounded-sm bg-accent',
  circle: 'block size-12 rounded-full bg-accent',
  button: 'block h-[0.75em] w-20 rounded-sm bg-accent',
};
const lengths = /^(?:0|\d+(?:\.\d+)?(?:px|rem|em|%|vw|vh|ch))$/;

export class Skeleton extends HTMLElement {
  static observedAttributes = ['kind', 'lines', 'width', 'height', 'ratio', 'radius', 'font-size'];

  connectedCallback() { this.render(); }
  attributeChangedCallback() { if (this.isConnected) this.render(); }

  render() {
    const kind = Object.hasOwn(shapes, this.getAttribute('kind')) ? this.getAttribute('kind') : 'text';
    const count = kind === 'text' ? Math.max(1, Math.min(12, Number.parseInt(this.getAttribute('lines'), 10) || 1)) : 1;
    const container = this.ownerDocument.createElement('span');
    container.className = 'grid min-w-0 gap-[0.5em]';
    container.setAttribute('aria-hidden', 'true');
    const fontSize = this.getAttribute('font-size');
    if (['text', 'title', 'button'].includes(kind)) {
      const baseSize = fontSize && lengths.test(fontSize) ? fontSize : '1em';
      container.style.fontSize = `calc(${baseSize} + var(--theme-skeleton-text-offset, 3px))`;
    }
    for (let i = 0; i < count; i++) {
      const line = this.ownerDocument.createElement('span');
      line.className = shapes[kind];
      line.dataset.sb2Part = 'shape';
      for (const [attribute, property] of [['width', 'width'], ['height', 'height'], ['radius', 'borderRadius']]) {
        const value = this.getAttribute(attribute);
        if (value && lengths.test(value)) line.style[property] = value;
      }
      const ratio = this.getAttribute('ratio');
      if (ratio && /^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/.test(ratio) && ratio.split('/').every(value => Number(value) > 0)) line.style.aspectRatio = ratio;
      if (kind === 'text' && count > 1 && i === count - 1 && !this.hasAttribute('width')) {
        line.classList.remove('w-full');
        line.classList.add('w-2/3');
      }
      if (kind === 'logo' || kind === 'image') {
        const marker = this.ownerDocument.createElement('span');
        marker.dataset.sb2Marker = kind;
        marker.className = 'pointer-events-none absolute inset-0 flex items-center justify-center';
        if (kind === 'logo') {
          const label = this.ownerDocument.createElement('span');
          label.className = 'select-none text-xs font-semibold tracking-widest text-muted';
          label.textContent = 'LOGO';
          marker.append(label);
        } else {
          marker.innerHTML = '<span class="relative block aspect-[6/5] w-1/4 min-w-4 max-w-12 overflow-hidden rounded-sm border border-muted"><span class="absolute right-[15%] top-[15%] size-1/5 rounded-full bg-muted"></span><span class="absolute -bottom-1/4 left-[5%] size-3/4 rotate-45 border-l border-t border-muted"></span><span class="absolute -bottom-1/4 right-0 size-1/2 rotate-45 border-l border-t border-muted"></span></span>';
        }
        line.append(marker);
      }
      container.append(line);
    }
    this.replaceChildren(container);
  }
}

export function createSkeleton(options = {}, doc = document) {
  const element = doc.createElement('skeleton-placeholder');
  for (const key of ['kind', 'lines', 'width', 'height', 'ratio', 'radius']) {
    if (options[key] != null) element.setAttribute(key, String(options[key]));
  }
  if (options.fontSize != null) element.setAttribute('font-size', String(options.fontSize));
  return element;
}
