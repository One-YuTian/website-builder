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
    }, { signal: this._controller.signal });
  }

  render() {
    const list = this.viewMode === 'list';
    const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary';

    this.innerHTML = `
      <article class="${list ? 'flex flex-col sm:flex-row' : ''} min-w-0 overflow-hidden rounded-2xl border border-outline/50 bg-surface font-sans text-content hover:border-primary/50 transition-colors">
        <div class="relative ${list ? 'w-full sm:w-48 shrink-0' : ''}">
          <button type="button" data-action="open-product" class="block w-full ${focusRing}">
            <span class="relative block w-full aspect-square overflow-hidden bg-accent ${list ? 'rounded-t-2xl sm:rounded-tr-none sm:rounded-l-2xl' : 'rounded-t-2xl'}">
              <span class="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span class="relative block aspect-[6/5] w-1/4 min-w-4 max-w-12 overflow-hidden rounded-sm border border-muted">
                  <span class="absolute right-[15%] top-[15%] size-1/5 rounded-full bg-muted"></span>
                  <span class="absolute -bottom-1/4 left-[5%] size-3/4 rotate-45 border-l border-t border-muted"></span>
                  <span class="absolute -bottom-1/4 right-0 size-1/2 rotate-45 border-l border-t border-muted"></span>
                </span>
              </span>
            </span>
          </button>
        </div>
        <div class="p-3.5 flex flex-col justify-between flex-1 ${list ? 'border-t sm:border-t-0 sm:border-l border-outline/30 sm:p-5' : 'border-t border-outline/30'} space-y-3">
          <div>
            <button type="button" data-action="open-product" class="block w-full rounded-sm text-left ${focusRing}">
              <span class="block h-[0.75em] w-full rounded-sm bg-accent mb-1.5"></span>
              <span class="block h-[0.75em] w-3/4 rounded-sm bg-accent mb-2"></span>
            </button>
            <div class="flex items-center gap-2">
              <span class="flex gap-1">${Array.from({ length: 5 }, () => '<span class="block size-2 rounded-full bg-accent"></span>').join('')}</span>
              ${this.discounted ? `<span class="block h-[0.65em] w-9 rounded-xs bg-primary/20"></span>` : ''}
            </div>
          </div>
          <div class="flex items-end justify-between pt-1">
            <div class="flex flex-col gap-1">
              <span class="block h-[0.85em] ${list ? 'w-24' : 'w-18'} rounded-sm bg-accent"></span>
              ${this.discounted ? `<span class="block h-[0.65em] w-12 rounded-sm bg-accent opacity-50"></span>` : ''}
            </div>
            <button type="button" data-action="add-cart" class="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-full border border-primary bg-surface text-primary hover:bg-primary hover:text-white transition-colors ${focusRing}">
              <span class="block size-3 rounded-full bg-current"></span>
            </button>
          </div>
        </div>
      </article>`;
  }
}

