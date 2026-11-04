export const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary';
export const escapeAttribute = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
export const placeholder = (kind, width, size, region) => `<skeleton-placeholder kind="${kind}"${kind === 'image' && size === '100%' ? ' class="h-full [&>span]:h-full"' : ''}${width ? ` width="${width}"` : ''}${size ? ` ${['text', 'title', 'button'].includes(kind) ? 'font-size' : 'height'}="${size}"` : ''}${region ? ` data-region="${region}"` : ''}></skeleton-placeholder>`;

export class ViewElement extends HTMLElement {
  connectedCallback() {
    this.classList.add('block', 'min-w-0');
    this._events?.abort();
    this._events = new AbortController();
    this.render();
    this.bind?.(this._events.signal);
  }
  disconnectedCallback() { this._events?.abort(); }
  attributeChangedCallback(name, previous, value) { if (this.isConnected && previous !== value) this.render(); }
  emit(name, detail) { this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true })); }
}
