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

  get theme() { return this.getAttribute('theme') || 'dark'; }
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
    const focusRing = isLight
      ? 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary'
      : 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-secondary';
    const headerCls = isLight
      ? 'bg-surface font-sans text-content border-b border-outline/30 shadow-xs'
      : 'bg-surface bg-linear-to-b from-primary to-primary/80 font-sans text-on-secondary';
    const searchCls = isLight
      ? 'bg-accent/25 border border-outline/40 text-content focus-within:ring-2 focus-within:ring-primary'
      : 'bg-surface text-content focus-within:ring-2 focus-within:ring-on-secondary';
    const actionBtnCls = isLight
      ? 'hover:bg-accent/40 text-content'
      : 'hover:bg-on-secondary/10 text-on-secondary';
    const navLinkCls = isLight
      ? 'text-content/80 hover:text-primary'
      : 'hover:opacity-75 text-on-secondary';

    const authSection = this.isLoggedIn
      ? `<div role="button" tabindex="0" data-destination="orders" class="rounded-sm py-2 ${navLinkCls} ${focusRing}"><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></div>
         <button type="button" data-action="logout" class="rounded-sm py-2 ${navLinkCls} ${focusRing}"><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></button>`
      : `<div role="button" tabindex="0" data-destination="login" class="rounded-sm py-2 ${navLinkCls} ${focusRing}"><span class="block h-[0.75em] w-10 rounded-sm bg-accent"></span></div>
         <div role="button" tabindex="0" data-destination="register" class="rounded-sm py-2 ${navLinkCls} ${focusRing}"><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></div>`;

    this.innerHTML = `
      <header class="${headerCls}">
        <div data-region="header-content" class="content-container">
          <div data-region="top-bar" class="hidden items-center justify-center gap-4 py-1 md:flex lg:justify-between border-b ${isLight ? 'border-outline/20' : 'border-on-secondary/10'}">
            <div data-region="promotion" class="hidden shrink-0 lg:block"><span class="block h-[0.75em] w-56 rounded-sm bg-accent"></span></div>
            <nav class="flex items-center gap-5 lg:gap-7">
              <div role="button" tabindex="0" data-destination="home" class="rounded-sm py-2 ${navLinkCls} ${focusRing}"><span class="block h-[0.75em] w-10 rounded-sm bg-accent"></span></div>
              <div role="button" tabindex="0" data-destination="shop" class="rounded-sm py-2 ${navLinkCls} ${focusRing}"><span class="block h-[0.75em] w-10 rounded-sm bg-accent"></span></div>
              <div role="button" tabindex="0" data-destination="about" class="rounded-sm py-2 ${navLinkCls} ${focusRing}"><span class="block h-[0.75em] w-10 rounded-sm bg-accent"></span></div>
              <div role="button" tabindex="0" data-destination="contact" class="rounded-sm py-2 ${navLinkCls} ${focusRing}"><span class="block h-[0.75em] w-10 rounded-sm bg-accent"></span></div>
              <div role="button" tabindex="0" data-destination="wishlist" class="rounded-sm py-2 ${navLinkCls} ${focusRing}"><span class="block h-[0.75em] w-10 rounded-sm bg-accent"></span></div>
              ${authSection}
            </nav>
          </div>
          <div class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2 pb-3 pt-2 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-8 md:py-4">
            <div role="button" tabindex="0" data-destination="home" class="order-1 flex h-14 items-center rounded-sm ${focusRing}">
              <span class="relative flex h-10 w-32 items-center justify-center overflow-hidden rounded-xl bg-accent select-none text-xs font-semibold tracking-widest text-muted">LOGO</span>
            </div>
            <form role="search" class="relative order-3 col-span-2 min-w-0 md:order-2 md:col-span-1 md:ml-auto md:w-full md:max-w-2xl">
              <div class="relative flex h-11 items-center rounded-md ${searchCls}">
                <input type="search" name="query" autocomplete="off" class="h-full w-full min-w-0 rounded-md border-0 bg-transparent py-2 pl-4 pr-2 outline-none">
                <span data-region="search-placeholder" class="pointer-events-none absolute left-4"><span class="block h-[0.75em] w-36 rounded-sm bg-accent"></span></span>
                <button type="submit" class="mr-1 flex size-10 shrink-0 items-center justify-center rounded-md ${focusRing}">
                  <span class="block size-4 rounded-full bg-accent"></span>
                </button>
              </div>
              <ul data-region="search-suggestions" hidden class="absolute inset-x-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-xl border border-outline bg-surface p-2 text-content shadow-xl"></ul>
            </form>
            <div class="order-2 flex items-center justify-end gap-1 md:order-3 md:gap-4">
              <button type="button" data-action="cart" class="relative flex size-10 shrink-0 items-center justify-center rounded-md ${actionBtnCls} ${focusRing}">
                <span class="block size-5 rounded-full bg-accent"></span>
                ${this.cartCount ? `<span class="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-secondary text-[10px] text-white font-bold">${this.cartCount}</span>` : ''}
              </button>
              <button type="button" data-action="menu" class="flex md:hidden size-10 shrink-0 items-center justify-center rounded-md ${actionBtnCls} ${focusRing}">
                <span class="block size-5 rounded-full bg-accent"></span>
              </button>
            </div>
          </div>
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
          <div role="button" tabindex="0" data-destination="about" class="block rounded-lg px-2 py-3 hover:bg-accent/40"><span class="block h-[0.75em] w-24 rounded-sm bg-accent"></span></div>
          <div role="button" tabindex="0" data-destination="contact" class="block rounded-lg px-2 py-3 hover:bg-accent/40"><span class="block h-[0.75em] w-24 rounded-sm bg-accent"></span></div>
          <div role="button" tabindex="0" data-destination="wishlist" class="block rounded-lg px-2 py-3 hover:bg-accent/40"><span class="block h-[0.75em] w-24 rounded-sm bg-accent"></span></div>
        </nav>
        <div class="mt-6 flex flex-col items-start gap-3 border-t border-outline px-2 pt-6">
          ${authSection}
        </div>
      </dialog>`;
  }
}

