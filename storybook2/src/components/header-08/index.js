export class Header extends HTMLElement {
  static observedAttributes = ['is-logged-in', 'cart-count', 'wishlist-count', 'theme'];

  constructor() {
    super();
    this._uid = 'header-08-' + Math.random().toString(36).substring(2, 8);
    this._searchSuggestions = [];
    window.$header = this;
  }

  get isLoggedIn() { return this.hasAttribute('is-logged-in'); }
  set isLoggedIn(val) { this.toggleAttribute('is-logged-in', Boolean(val)); }

  get cartCount() { return Number(this.getAttribute('cart-count')) || 0; }
  set cartCount(val) { this.setAttribute('cart-count', String(Math.max(0, Math.floor(Number(val) || 0)))); }

  get wishlistCount() { return Number(this.getAttribute('wishlist-count')) || 0; }
  set wishlistCount(val) { this.setAttribute('wishlist-count', String(Math.max(0, Math.floor(Number(val) || 0)))); }

  get theme() { return this.getAttribute('theme') || 'dark'; }
  set theme(val) { this.setAttribute('theme', String(val)); }

  get searchSuggestions() { return [...this._searchSuggestions]; }
  set searchSuggestions(list) {
    this._searchSuggestions = Array.isArray(list) ? list.slice(0, 6) : [];
  }

  toggleMobileMenu(force) {
    const dialog = this.querySelector('dialog');
    if (!dialog) return;
    if (typeof force === 'boolean') {
      if (force && !dialog.open) dialog.showModal();
      else if (!force && dialog.open) dialog.close();
    } else {
      if (dialog.open) dialog.close();
      else dialog.showModal();
    }
  }

  toggleAccountDropdown() {
    const panel = this.querySelector('[data-region="account-panel"]');
    if (panel) panel.hidden = !panel.hidden;
  }

  updateCart(count) {
    this.cartCount = count;
  }

  updateWishlist(count) {
    this.wishlistCount = count;
  }

  connectedCallback() {
    this.classList.add('block', 'sticky', 'top-0', 'z-40');
    this.render();
    this.bindEvents();
  }

  disconnectedCallback() {
    this._controller?.abort();
    if (window.$header === this) delete window.$header;
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  bindEvents() {
    this._controller?.abort();
    this._controller = new AbortController();
    const { signal } = this._controller;

    this.addEventListener('click', (e) => {
      const target = e.target;
      const actionEl = target.closest('[data-action]');
      if (!actionEl) return;

      const action = actionEl.dataset.action;
      if (action === 'menu') {
        this.toggleMobileMenu();
      } else if (action === 'close-menu') {
        this.toggleMobileMenu(false);
      } else if (action === 'account') {
        this.toggleAccountDropdown();
      } else if (action === 'cart') {
        this.emit('header-navigate', { destination: 'cart' });
      } else if (action === 'wishlist') {
        this.emit('header-navigate', { destination: 'wishlist' });
      } else if (action === 'login') {
        this.emit('header-navigate', { destination: 'login' });
      } else if (action === 'register') {
        this.emit('header-navigate', { destination: 'register' });
      } else if (action === 'nav') {
        const id = actionEl.dataset.navId;
        this.emit('header-navigate', { destination: 'category', id });
        this.toggleMobileMenu(false);
      }
    }, { signal });

    document.addEventListener('pointerdown', (e) => {
      const panel = this.querySelector('[data-region="account-panel"]');
      const trigger = this.querySelector('[data-action="account"]');
      if (panel && !panel.contains(e.target) && !trigger?.contains(e.target)) {
        panel.hidden = true;
      }
    }, { signal });
  }

  emit(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  render() {
    const isLight = this.theme === 'light';
    const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary';
    const headerCls = isLight ? 'bg-surface font-sans text-content border-b border-outline/30 shadow-xs' : 'bg-secondary font-sans text-on-secondary';
    const actionBtnCls = isLight ? 'hover:bg-accent/40 text-content' : 'hover:bg-on-secondary/10 text-on-secondary';
    const navLinkCls = isLight ? 'text-content/80 hover:text-primary' : 'text-on-secondary/90 hover:opacity-75';

    const authSection = this.isLoggedIn
      ? `<div class="relative">
          <button type="button" data-action="account" class="flex size-9 items-center justify-center rounded-lg ${actionBtnCls} ${focusRing}">
            <span class="block size-6 rounded-full bg-accent"></span>
          </button>
          <div data-region="account-panel" hidden class="absolute right-0 top-full mt-2 w-48 rounded-xl border border-outline/60 bg-surface p-2 shadow-xl z-50 text-content">
            <button type="button" data-action="account-orders" class="w-full rounded-lg p-2 text-left hover:bg-accent/40 text-sm"><span class="block h-[0.75em] w-20 rounded-sm bg-accent"></span></button>
            <button type="button" data-action="account-wishlist" class="w-full rounded-lg p-2 text-left hover:bg-accent/40 text-sm"><span class="block h-[0.75em] w-16 rounded-sm bg-accent"></span></button>
            <button type="button" data-action="logout" class="w-full rounded-lg p-2 text-left hover:bg-accent/40 text-sm"><span class="block h-[0.75em] w-14 rounded-sm bg-accent"></span></button>
          </div>
        </div>`
      : `<div class="relative">
          <button type="button" data-action="account" class="flex size-9 items-center justify-center rounded-lg ${actionBtnCls} ${focusRing}">
            <span class="block size-4 rounded-full bg-accent"></span>
          </button>
          <div data-region="account-panel" hidden class="absolute right-0 top-full mt-2 w-40 rounded-xl border border-outline/60 bg-surface p-2 shadow-xl z-50 text-content">
            <button type="button" data-action="login" class="w-full rounded-lg p-2 text-left hover:bg-accent/40 text-sm font-medium"><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></button>
            <button type="button" data-action="register" class="w-full rounded-lg p-2 text-left hover:bg-accent/40 text-sm font-medium"><span class="block h-[0.75em] w-16 rounded-sm bg-accent"></span></button>
          </div>
        </div>`;

    this.innerHTML = `
      <header class="${headerCls} py-3">
        <div class="content-container flex items-center justify-between gap-6">
          <div class="flex items-center gap-8">
            <div data-region="logo" class="flex-shrink-0">
              <div role="button" tabindex="0" data-action="nav" data-nav-id="home" class="flex items-center rounded-lg ${focusRing}">
                <span class="relative flex h-10 w-28 items-center justify-center overflow-hidden rounded-xl bg-accent"><span class="select-none text-xs font-semibold tracking-widest text-muted">LOGO</span></span>
              </div>
            </div>

            <nav data-region="desktop-nav" class="hidden md:flex items-center gap-6">
              <div role="button" tabindex="0" data-action="nav" data-nav-id="home" class="py-1 font-medium transition-colors ${navLinkCls} ${focusRing}"><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></div>
              <div role="button" tabindex="0" data-action="nav" data-nav-id="shop" class="py-1 font-medium transition-colors ${navLinkCls} ${focusRing}"><span class="block h-[0.75em] w-10 rounded-sm bg-accent"></span></div>
              <div role="button" tabindex="0" data-action="nav" data-nav-id="about" class="py-1 font-medium transition-colors ${navLinkCls} ${focusRing}"><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></div>
            </nav>
          </div>

          <div class="flex items-center justify-end gap-1.5 sm:gap-3">
            <div data-region="auth">${authSection}</div>

            <button type="button" data-action="wishlist" class="relative flex size-9 items-center justify-center rounded-lg ${actionBtnCls} ${focusRing}">
              <span class="block size-4 rounded-sm bg-accent"></span>
              <span data-region="wishlist-badge" class="${this.wishlistCount > 0 ? '' : 'hidden'} absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-on-secondary text-[10px] font-bold shadow-xs">${this.wishlistCount}</span>
            </button>

            <button type="button" data-action="cart" class="relative flex size-9 items-center justify-center rounded-lg ${actionBtnCls} ${focusRing}">
              <span class="block size-4 rounded-sm bg-accent"></span>
              <span data-region="cart-badge" class="${this.cartCount > 0 ? '' : 'hidden'} absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-on-secondary text-[10px] font-bold shadow-xs">${this.cartCount}</span>
            </button>

            <button type="button" data-action="menu" class="flex size-9 items-center justify-center rounded-lg md:hidden ${actionBtnCls} ${focusRing}">
              <span class="flex flex-col gap-1"><span class="block h-0.5 w-4 bg-accent"></span><span class="block h-0.5 w-4 bg-accent"></span><span class="block h-0.5 w-4 bg-accent"></span></span>
            </button>
          </div>
        </div>

        <dialog data-region="mobile-drawer" class="fixed inset-0 m-0 h-full max-h-none w-72 max-w-[85vw] border-r border-outline/40 bg-surface p-0 shadow-2xl backdrop:bg-black/40">
          <div class="flex h-full flex-col p-4 text-content">
            <div class="flex items-center justify-between border-b border-outline/30 pb-4">
              <span class="relative flex h-8 w-24 items-center justify-center overflow-hidden rounded-lg bg-accent"><span class="select-none text-xs font-semibold tracking-widest text-muted">LOGO</span></span>
              <button type="button" data-action="close-menu" class="flex size-8 items-center justify-center rounded-lg hover:bg-accent/40 ${focusRing}"><span class="block size-4 rounded-full bg-accent"></span></button>
            </div>
            <nav class="flex flex-col gap-2 py-4">
              <div role="button" tabindex="0" data-action="nav" data-nav-id="home" class="rounded-lg p-2.5 font-medium hover:bg-accent/40"><span class="block h-[0.75em] w-16 rounded-sm bg-accent"></span></div>
              <div role="button" tabindex="0" data-action="nav" data-nav-id="shop" class="rounded-lg p-2.5 font-medium hover:bg-accent/40"><span class="block h-[0.75em] w-14 rounded-sm bg-accent"></span></div>
              <div role="button" tabindex="0" data-action="nav" data-nav-id="about" class="rounded-lg p-2.5 font-medium hover:bg-accent/40"><span class="block h-[0.75em] w-16 rounded-sm bg-accent"></span></div>
            </nav>
            <div class="mt-auto border-t border-outline/30 pt-4 flex flex-col gap-2">
              <button type="button" data-action="login" class="w-full rounded-lg p-2 text-left hover:bg-accent/40 font-medium"><span class="block h-[0.75em] w-16 rounded-sm bg-accent"></span></button>
              <button type="button" data-action="register" class="w-full rounded-lg p-2 text-left hover:bg-accent/40 font-medium"><span class="block h-[0.75em] w-20 rounded-sm bg-accent"></span></button>
            </div>
          </div>
        </dialog>
      </header>`;
  }
}

