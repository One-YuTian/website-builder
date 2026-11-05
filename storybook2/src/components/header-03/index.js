export class Header extends HTMLElement {
  static observedAttributes = ['is-logged-in', 'cart-count', 'wishlist-count', 'theme'];

  constructor() {
    super();
    this._uid = 'header-' + Math.random().toString(36).substring(2, 8);
    this._searchSuggestions = [];
    window.$header = this;
  }

  get isLoggedIn() { return this.hasAttribute('is-logged-in'); }
  set isLoggedIn(val) { this.toggleAttribute('is-logged-in', Boolean(val)); }

  get cartCount() { return Number(this.getAttribute('cart-count')) || 0; }
  set cartCount(val) { this.setAttribute('cart-count', String(Math.max(0, Math.floor(Number(val) || 0)))); }

  get wishlistCount() { return Number(this.getAttribute('wishlist-count')) || 0; }
  set wishlistCount(val) { this.setAttribute('wishlist-count', String(Math.max(0, Math.floor(Number(val) || 0)))); }

  get theme() { return this.getAttribute('theme') || 'light'; }
  set theme(val) { this.setAttribute('theme', String(val)); }

  get searchSuggestions() { return [...this._searchSuggestions]; }
  set searchSuggestions(list) {
    this._searchSuggestions = Array.isArray(list) ? list.slice(0, 6) : [];
    if (this.isConnected) this.updateSuggestions();
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
      const target = e.target.closest('[data-action], [data-destination]');
      if (!target || !this.contains(target)) return;

      if (target.dataset.destination) {
        e.preventDefault();
        this.emit('header-navigate', { destination: target.dataset.destination });
        this.toggleMobileMenu(false);
        return;
      }

      switch (target.dataset.action) {
        case 'menu':
          this.toggleMobileMenu(true);
          break;
        case 'close-menu':
          this.toggleMobileMenu(false);
          break;
        case 'cart':
          this.emit('header-cart');
          if (window.$cart?.toggleDrawer) window.$cart.toggleDrawer();
          break;
        case 'logout':
          this.emit('header-logout');
          this.isLoggedIn = false;
          break;
      }
    }, { signal });

    const input = this.querySelector('input[name="query"]');
    input?.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      const placeholder = this.querySelector('[data-region="search-placeholder"]');
      if (placeholder) placeholder.hidden = Boolean(query);
      this.emit('header-search-input', { query });
    }, { signal });

    this.querySelector('form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = input?.value.trim() || '';
      if (query) {
        this.hideSuggestions();
        this.emit('header-search', { query });
      }
    }, { signal });

    document.addEventListener('pointerdown', (e) => {
      if (!this.querySelector('form')?.contains(e.target)) {
        this.hideSuggestions();
      }
    }, { signal });
  }

  hideSuggestions() {
    const list = this.querySelector('[data-region="search-suggestions"]');
    if (list) list.hidden = true;
  }

  updateSuggestions() {
    const list = this.querySelector('[data-region="search-suggestions"]');
    if (!list) return;
    list.replaceChildren();
    if (!this._searchSuggestions.length) {
      list.hidden = true;
      return;
    }
    list.hidden = false;
    this._searchSuggestions.forEach(item => {
      const li = document.createElement('li');
      li.className = 'p-2 hover:bg-accent/40 cursor-pointer rounded-lg flex items-center gap-3';
      li.innerHTML = `<span class="block size-10 rounded-sm bg-accent"></span><span class="flex-1 text-sm font-medium">${item.title || item.id}</span>`;
      li.addEventListener('click', () => {
        this.hideSuggestions();
        this.emit('header-navigate', { destination: 'product', id: item.id });
      });
      list.appendChild(li);
    });
  }

  emit(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  render() {
    const isLight = this.theme === 'light';
    const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary';
    const headerCls = isLight ? 'border-b border-outline/50 bg-surface font-sans text-content shadow-xs' : 'border-b border-on-secondary/10 bg-secondary font-sans text-on-secondary shadow-md';
    const actionBtnCls = isLight ? 'hover:bg-accent/40 text-content' : 'hover:bg-on-secondary/10 text-on-secondary';
    const navLinkCls = isLight ? 'text-content/80 hover:text-primary' : 'text-on-secondary/80 hover:text-white';

    const authDesktop = this.isLoggedIn
      ? `<div role="button" tabindex="0" data-destination="orders" class="flex size-9 items-center justify-center rounded-full ${actionBtnCls} ${focusRing}"><span class="block size-5 rounded-full bg-accent"></span></div>
         <button type="button" data-action="logout" class="rounded-full border-2 border-primary px-4 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors ${focusRing}"><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></button>`
      : `<div role="button" tabindex="0" data-destination="login" class="rounded-full border-2 border-primary px-4 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors ${focusRing}"><span class="block h-[0.75em] w-10 rounded-sm bg-accent"></span></div>
         <div role="button" tabindex="0" data-destination="register" class="rounded-full bg-primary px-4 py-1 text-xs font-medium text-on-secondary hover:opacity-90 transition-opacity ${focusRing}"><span class="block h-[0.75em] w-10 rounded-sm bg-accent"></span></div>`;

    const authMobile = this.isLoggedIn
      ? `<div role="button" tabindex="0" data-destination="orders" class="block rounded-lg px-2 py-3 hover:bg-accent/40"><span class="block h-[0.75em] w-20 rounded-sm bg-accent"></span></div>
         <button type="button" data-action="logout" class="rounded-full border-2 border-primary px-4 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors ${focusRing}"><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></button>`
      : `<div class="flex items-center gap-3">
           <div role="button" tabindex="0" data-destination="login" class="rounded-full border-2 border-primary px-4 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors ${focusRing}"><span class="block h-[0.75em] w-10 rounded-sm bg-accent"></span></div>
           <div role="button" tabindex="0" data-destination="register" class="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-on-secondary hover:opacity-90 transition-opacity ${focusRing}"><span class="block h-[0.75em] w-10 rounded-sm bg-accent"></span></div>
         </div>`;

    this.innerHTML = `
      <header class="${headerCls}">
        <div data-region="header-content" class="content-container">
          <div class="flex h-16 items-center justify-between gap-4">
            <div class="shrink-0">
              <div role="button" tabindex="0" data-destination="home" class="flex h-10 items-center rounded-sm ${focusRing}">
                <span class="relative flex h-10 w-32 items-center justify-center overflow-hidden rounded-xl bg-accent select-none text-xs font-semibold tracking-widest text-muted">LOGO</span>
              </div>
            </div>
            <form role="search" class="relative hidden flex-1 max-w-2xl mx-6 md:block">
              <div class="relative flex h-10 items-center rounded-lg border ${isLight ? 'border-outline bg-surface text-content' : 'border-outline/40 bg-surface text-content'} focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <input type="search" name="query" autocomplete="off" class="h-full w-full min-w-0 rounded-lg border-0 bg-transparent py-1.5 pl-3 pr-9 text-sm outline-none">
                <span data-region="search-placeholder" class="pointer-events-none absolute left-3"><span class="block h-[0.75em] w-36 rounded-sm bg-accent"></span></span>
                <button type="submit" class="absolute right-1.5 flex size-7 items-center justify-center rounded-full bg-primary text-on-secondary hover:opacity-90 transition-opacity ${focusRing}">
                  <span class="block size-3.5 rounded-full bg-accent"></span>
                </button>
              </div>
              <ul data-region="search-suggestions" hidden class="absolute inset-x-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-xl border border-outline bg-surface p-2 text-content shadow-xl"></ul>
            </form>
            <div class="hidden items-center gap-4 md:flex">
              <button type="button" data-action="cart" class="relative flex size-10 shrink-0 items-center justify-center rounded-lg ${actionBtnCls} ${focusRing}">
                <span class="block size-5 rounded-full bg-accent"></span>
                ${this.cartCount ? `<span class="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">${this.cartCount}</span>` : ''}
              </button>
              <span class="${isLight ? 'text-outline' : 'text-on-secondary/30'}">|</span>
              <div class="flex items-center gap-2">
                ${authDesktop}
              </div>
            </div>
            <div class="flex items-center gap-2 md:hidden">
              <button type="button" data-action="cart" class="relative flex size-10 shrink-0 items-center justify-center rounded-lg ${actionBtnCls} ${focusRing}">
                <span class="block size-5 rounded-full bg-accent"></span>
                ${this.cartCount ? `<span class="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">${this.cartCount}</span>` : ''}
              </button>
              <button type="button" data-action="menu" class="flex size-10 shrink-0 items-center justify-center rounded-lg ${actionBtnCls} ${focusRing}">
                <span class="block size-5 rounded-full bg-accent"></span>
              </button>
            </div>
          </div>
          <nav class="hidden items-center justify-center gap-8 pb-3 md:flex">
            <div role="button" tabindex="0" data-destination="home" class="rounded-sm px-2 py-1 text-xs uppercase tracking-wider ${navLinkCls} transition-colors ${focusRing}"><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></div>
            <div role="button" tabindex="0" data-destination="shop" class="rounded-sm px-2 py-1 text-xs uppercase tracking-wider ${navLinkCls} transition-colors ${focusRing}"><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></div>
            <div role="button" tabindex="0" data-destination="wishlist" class="rounded-sm px-2 py-1 text-xs uppercase tracking-wider ${navLinkCls} transition-colors ${focusRing}"><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></div>
            <div role="button" tabindex="0" data-destination="about" class="rounded-sm px-2 py-1 text-xs uppercase tracking-wider hover:text-primary transition-colors ${focusRing}"><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></div>
            <div role="button" tabindex="0" data-destination="contact" class="rounded-sm px-2 py-1 text-xs uppercase tracking-wider hover:text-primary transition-colors ${focusRing}"><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></div>
          </nav>
        </div>
      </header>
      <dialog class="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-80 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain border-0 bg-surface p-6 text-content shadow-xl backdrop:bg-black/50">
        <div class="mb-6 flex items-center justify-between gap-4">
          <span class="relative flex h-8 w-28 items-center justify-center overflow-hidden rounded-lg bg-accent select-none text-xs font-semibold tracking-widest text-muted">LOGO</span>
          <button type="button" autofocus data-action="close-menu" class="flex size-10 items-center justify-center rounded-lg hover:bg-accent/40 ${focusRing}">
            <span class="block size-5 rounded-full bg-accent"></span>
          </button>
        </div>
        <nav class="space-y-3">
          <div role="button" tabindex="0" data-destination="home" class="block rounded-lg px-2 py-3 hover:bg-accent/40"><span class="block h-[0.75em] w-24 rounded-sm bg-accent"></span></div>
          <div role="button" tabindex="0" data-destination="shop" class="block rounded-lg px-2 py-3 hover:bg-accent/40"><span class="block h-[0.75em] w-24 rounded-sm bg-accent"></span></div>
          <div role="button" tabindex="0" data-destination="wishlist" class="block rounded-lg px-2 py-3 hover:bg-accent/40"><span class="block h-[0.75em] w-24 rounded-sm bg-accent"></span></div>
          <div role="button" tabindex="0" data-destination="about" class="block rounded-lg px-2 py-3 hover:bg-accent/40"><span class="block h-[0.75em] w-24 rounded-sm bg-accent"></span></div>
          <div role="button" tabindex="0" data-destination="contact" class="block rounded-lg px-2 py-3 hover:bg-accent/40"><span class="block h-[0.75em] w-24 rounded-sm bg-accent"></span></div>
        </nav>
        <div class="mt-6 flex flex-col items-start gap-3 border-t border-outline px-2 pt-6">
          ${authMobile}
        </div>
      </dialog>`;
  }
}

