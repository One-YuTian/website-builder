export class Card extends HTMLElement {
  static observedAttributes = ['product-id', 'view-mode', 'discounted'];

  constructor() {
    super();
    window.$card = this;
  }

  get productId() { return this.getAttribute('product-id') || 'product-01'; }
  set productId(val) { this.setAttribute('product-id', String(val)); }

  get viewMode() { return this.getAttribute('view-mode') === 'list' ? 'list' : 'grid'; }
  set viewMode(val) { this.setAttribute('view-mode', val === 'list' ? 'list' : 'grid'); }

  get discounted() { return this.hasAttribute('discounted'); }
  set discounted(val) { this.toggleAttribute('discounted', Boolean(val)); }

  connectedCallback() {
    this.classList.add('block', 'min-w-0');
    this.render();
    this.bindEvents();
  }

  disconnectedCallback() {
    this._controller?.abort();
    if (window.$card === this) delete window.$card;
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  emit(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  bindEvents() {
    this._controller?.abort();
    this._controller = new AbortController();
    this.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="open-product"]');
      if (btn && this.contains(btn)) {
        this.emit('product-navigate', { productId: this.productId });
        if (window.$product?.open) window.$product.open(this.productId);
      }
      const cartBtn = e.target.closest('[data-action="add-cart"]');
      if (cartBtn && this.contains(cartBtn)) {
        this.emit('product-navigate', { productId: this.productId, action: 'add-cart' });
      }
      const wishBtn = e.target.closest('[data-action="toggle-wishlist"]');
      if (wishBtn && this.contains(wishBtn)) {
        this.emit('product-navigate', { productId: this.productId, action: 'toggle-wishlist' });
      }
    }, { signal: this._controller.signal });
  }

  render() {
    const list = this.viewMode === 'list';
    const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary';

    this.innerHTML = `
      <article class="${list ? 'flex' : ''} min-w-0 overflow-hidden rounded-md border border-outline/40 bg-surface font-sans text-content shadow-xs">
        <div class="relative ${list ? 'w-32 shrink-0 self-start sm:w-48' : ''}">
          <button type="button" data-action="open-product" class="block w-full ${focusRing}">
            <span class="relative block w-full aspect-[4/3] overflow-hidden bg-accent">
              <span class="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span class="relative block aspect-[6/5] w-1/4 min-w-4 max-w-12 overflow-hidden rounded-sm border border-muted">
                  <span class="absolute right-[15%] top-[15%] size-1/5 rounded-full bg-muted"></span>
                  <span class="absolute -bottom-1/4 left-[5%] size-3/4 rotate-45 border-l border-t border-muted"></span>
                  <span class="absolute -bottom-1/4 right-0 size-1/2 rotate-45 border-l border-t border-muted"></span>
                </span>
              </span>
            </span>
          </button>
          ${this.discounted ? `<div class="pointer-events-none absolute left-2 top-2 flex size-10 sm:size-11 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-xs">-20%</div>` : ''}
          <button type="button" data-action="toggle-wishlist" class="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-surface/80 text-muted hover:text-primary transition-colors ${focusRing}">
            <span class="block size-3.5 rounded-full bg-accent"></span>
          </button>
        </div>
        <div class="min-w-0 flex-1 space-y-2 p-3 ${list ? 'border-l border-outline/30 sm:p-4' : 'border-t border-outline/30'}">
          <div>
            <button type="button" data-action="open-product" class="block w-full rounded-sm text-left ${focusRing}">
              <span class="block h-[0.75em] ${list ? 'w-2/3' : 'w-3/4'} rounded-sm bg-accent"></span>
            </button>
          </div>
          <div class="flex items-center gap-1">
            ${Array.from({ length: 5 }, () => '<span class="block size-2.5 rounded-full bg-accent"></span>').join('')}
          </div>
          ${list ? `<span class="block h-[0.75em] w-full rounded-sm bg-accent mb-1"></span><span class="block h-[0.75em] w-1/2 rounded-sm bg-accent"></span>` : ''}
          <div class="flex items-center gap-2 py-0.5">
            <span class="block h-[0.85em] ${list ? 'w-24' : 'w-20'} rounded-sm bg-accent"></span>
            ${this.discounted ? `<span class="block h-[0.7em] w-12 rounded-sm bg-accent opacity-60"></span>` : ''}
          </div>
          <button type="button" data-action="add-cart" class="w-full bg-primary py-2 px-3 flex items-center justify-center rounded-xs ${focusRing}">
            <span class="block h-[0.75em] w-16 rounded-sm bg-white/90"></span>
          </button>
        </div>
      </article>`;
  }
}

