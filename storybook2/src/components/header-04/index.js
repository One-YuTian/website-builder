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

  toggleAccountDropdown() {
    const panel = this.querySelector('[data-region="account-panel"]');
    if (panel) panel.hidden = !panel.hidden;
  }

  toggleCategories(force) {
    const panel = this.querySelector('[data-region="categories-panel"]');
    if (!panel) return;
    const isShown = panel.classList.contains('!block');
    const show = typeof force === 'boolean' ? force : !isShown;
    panel.classList.toggle('!block', show);
  }

  toggleMobileCategories(force) {
    const panel = this.querySelector('[data-region="mobile-categories"]');
    const arrow = this.querySelector('[data-region="categories-arrow"]');
    if (!panel) return;
    const isHidden = typeof force === 'boolean' ? !force : !panel.hidden;
    panel.hidden = isHidden;
    if (arrow) arrow.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
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
      const catLink = e.target.closest('[data-category]');
      if (catLink && this.contains(catLink)) {
        e.preventDefault();
        this.emit('header-navigate', { destination: 'category', categoryId: catLink.dataset.category });
        this.toggleCategories(false);
        this.toggleMobileMenu(false);
        return;
      }

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
        case 'account':
          if (!this.isLoggedIn) {
            this.emit('header-navigate', { destination: 'login' });
          } else {
            this.toggleAccountDropdown();
          }
          break;
        case 'toggle-categories':
          this.toggleCategories();
          break;
        case 'toggle-mobile-categories':
          this.toggleMobileCategories();
          break;
        case 'wishlist':
          this.emit('header-navigate', { destination: this.isLoggedIn ? 'wishlist' : 'login' });
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
      const panel = this.querySelector('[data-region="account-panel"]');
      const trigger = this.querySelector('[data-action="account"]');
      if (panel && !panel.contains(e.target) && !trigger?.contains(e.target)) {
        panel.hidden = true;
      }
      const catsPanel = this.querySelector('[data-region="categories-panel"]');
      const catsTrigger = this.querySelector('[data-action="toggle-categories"]');
      if (catsPanel && !catsPanel.contains(e.target) && !catsTrigger?.contains(e.target)) {
        catsPanel.classList.remove('!block');
      }
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
    const headerCls = isLight ? 'bg-surface text-content border-b border-outline/30 shadow-xs font-sans' : 'bg-secondary text-on-secondary shadow-md font-sans';
    const actionBtnCls = isLight ? 'hover:bg-accent/40 text-content' : 'hover:bg-on-secondary/10 text-on-secondary';
    const searchCls = isLight ? 'bg-accent/25 border border-outline/40 text-content focus-within:ring-2 focus-within:ring-primary' : 'bg-surface text-content focus-within:ring-2 focus-within:ring-primary';
    const subBarCls = isLight ? 'border-t border-outline/30 bg-accent/15 text-content' : 'border-t border-on-secondary/10 bg-secondary/90 text-on-secondary';
    const navLinkCls = isLight ? 'text-content/80 hover:text-primary' : 'text-on-secondary/80 hover:text-white';
    const catBtnCls = isLight ? 'text-content hover:text-primary' : 'text-on-secondary hover:text-white/80';

    const authDesktop = this.isLoggedIn
      ? `<div class="relative">
           <button type="button" data-action="account" class="flex items-center gap-2 ${catBtnCls} ${focusRing}">
             <span class="block size-5 rounded-full bg-accent"></span>
             <span class="block h-[0.75em] w-14 rounded-sm bg-accent"></span>
           </button>
           <div data-region="account-panel" hidden class="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-outline bg-surface p-3 text-content shadow-xl">
             <span class="block h-[0.75em] w-20 rounded-sm bg-accent mb-3"></span>
             <div class="flex flex-col items-start gap-2">
               <div role="button" tabindex="0" data-destination="orders" class="py-2 hover:opacity-75"><span class="block h-[0.75em] w-16 rounded-sm bg-accent"></span></div>
               <div role="button" tabindex="0" data-destination="wishlist" class="py-2 hover:opacity-75"><span class="block h-[0.75em] w-16 rounded-sm bg-accent"></span></div>
               <button type="button" data-action="logout" class="py-2 hover:opacity-75"><span class="block h-[0.75em] w-14 rounded-sm bg-accent"></span></button>
             </div>
           </div>
         </div>`
      : `<div role="button" tabindex="0" data-destination="login" class="flex items-center gap-2 ${catBtnCls} ${focusRing}">
           <span class="block size-5 rounded-full bg-accent"></span>
           <span class="block h-[0.75em] w-16 rounded-sm bg-accent"></span>
         </div>`;

    const authMobile = this.isLoggedIn
      ? `<div role="button" tabindex="0" data-destination="orders" class="block rounded-lg px-2 py-3 hover:bg-accent/40"><span class="block h-[0.75em] w-20 rounded-sm bg-accent"></span></div>
         <div role="button" tabindex="0" data-destination="wishlist" class="block rounded-lg px-2 py-3 hover:bg-accent/40"><span class="block h-[0.75em] w-20 rounded-sm bg-accent"></span></div>
         <button type="button" data-action="logout" class="rounded-sm py-2 hover:opacity-75 ${focusRing}"><span class="block h-[0.75em] w-14 rounded-sm bg-accent"></span></button>`
      : `<div role="button" tabindex="0" data-destination="login" class="rounded-sm py-2 hover:opacity-75 ${focusRing}"><span class="block h-[0.75em] w-16 rounded-sm bg-accent"></span></div>
         <div role="button" tabindex="0" data-destination="register" class="rounded-sm py-2 hover:opacity-75 ${focusRing}"><span class="block h-[0.75em] w-16 rounded-sm bg-accent"></span></div>`;

    this.innerHTML = `
      <div class="bg-primary text-white py-2">
        <div class="content-container flex items-center justify-center text-center">
          <span class="block h-[0.75em] w-64 max-w-full rounded-sm bg-white/40"></span>
        </div>
      </div>
      <header class="${headerCls}">
        <div data-region="header-content" class="content-container">
          <div class="flex h-16 items-center justify-between gap-4">
            <div class="shrink-0">
              <div role="button" tabindex="0" data-destination="home" class="flex h-10 items-center rounded-sm ${focusRing}">
                <span class="relative flex h-10 w-32 items-center justify-center overflow-hidden rounded-xl bg-accent select-none text-xs font-semibold tracking-widest text-muted">LOGO</span>
              </div>
            </div>
            <form role="search" class="relative hidden flex-1 max-w-md mx-6 md:block">
              <div class="relative flex h-10 items-center rounded-full ${searchCls}">
                <input type="search" name="query" autocomplete="off" class="h-full w-full min-w-0 rounded-full border-0 bg-transparent py-1.5 pl-4 pr-10 text-sm outline-none">
                <span data-region="search-placeholder" class="pointer-events-none absolute left-4"><span class="block h-[0.75em] w-32 rounded-sm bg-accent"></span></span>
                <button type="submit" class="absolute right-3 flex size-6 items-center justify-center rounded-full text-muted hover:text-content ${focusRing}">
                  <span class="block size-3.5 rounded-full bg-accent"></span>
                </button>
              </div>
              <ul data-region="search-suggestions" hidden class="absolute inset-x-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-xl border border-outline bg-surface p-2 text-content shadow-xl"></ul>
            </form>
            <div class="hidden items-center gap-6 md:flex">
              ${authDesktop}
              <button type="button" data-action="wishlist" class="relative flex size-10 shrink-0 items-center justify-center rounded-lg ${actionBtnCls} ${focusRing}">
                <span class="block size-5 rounded-full bg-accent"></span>
                ${this.wishlistCount ? `<span class="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">${this.wishlistCount}</span>` : ''}
              </button>
              <span class="${isLight ? 'text-outline' : 'text-on-secondary/30'}">|</span>
              <button type="button" data-action="cart" class="relative flex size-10 shrink-0 items-center justify-center rounded-lg ${actionBtnCls} ${focusRing}">
                <span class="block size-5 rounded-full bg-accent"></span>
                ${this.cartCount ? `<span class="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">${this.cartCount}</span>` : ''}
              </button>
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
        </div>
        <div class="${subBarCls} relative">
          <div class="content-container hidden md:flex items-center justify-between h-11">
            <div class="group/cats flex items-center h-full">
              <button type="button" data-action="toggle-categories" class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${catBtnCls} py-2.5 ${focusRing}">
                <span class="block size-3 rounded-full bg-accent"></span>
                <span class="block h-[0.75em] w-28 rounded-sm bg-accent"></span>
                <span class="block size-2 rounded-full bg-accent/60 transition-transform group-hover/cats:rotate-180"></span>
              </button>
              <div data-region="categories-panel" class="absolute left-0 right-0 top-full z-50 hidden group-hover/cats:block w-full border-b border-outline/30 bg-surface py-6 text-content shadow-2xl">
                <div class="content-container">
                  <div class="grid grid-cols-6 gap-4">
                    <div role="button" tabindex="0" data-category="category-01" class="flex flex-col items-center justify-center p-3 rounded-xl border border-outline/40 hover:border-primary transition-colors text-center group/cat">
                      <div class="size-16 sm:size-20 rounded-full border border-outline/40 bg-accent flex items-center justify-center mb-2 overflow-hidden">
                        <span class="block size-8 rounded-full bg-muted/30"></span>
                      </div>
                      <span class="block h-[0.75em] w-16 rounded-sm bg-accent"></span>
                    </div>
                    <div role="button" tabindex="0" data-category="category-02" class="flex flex-col items-center justify-center p-3 rounded-xl border border-outline/40 hover:border-primary transition-colors text-center group/cat">
                      <div class="size-16 sm:size-20 rounded-full border border-outline/40 bg-accent flex items-center justify-center mb-2 overflow-hidden">
                        <span class="block size-8 rounded-full bg-muted/30"></span>
                      </div>
                      <span class="block h-[0.75em] w-16 rounded-sm bg-accent"></span>
                    </div>
                    <div role="button" tabindex="0" data-category="category-03" class="flex flex-col items-center justify-center p-3 rounded-xl border border-outline/40 hover:border-primary transition-colors text-center group/cat">
                      <div class="size-16 sm:size-20 rounded-full border border-outline/40 bg-accent flex items-center justify-center mb-2 overflow-hidden">
                        <span class="block size-8 rounded-full bg-muted/30"></span>
                      </div>
                      <span class="block h-[0.75em] w-16 rounded-sm bg-accent"></span>
                    </div>
                    <div role="button" tabindex="0" data-category="category-04" class="flex flex-col items-center justify-center p-3 rounded-xl border border-outline/40 hover:border-primary transition-colors text-center group/cat">
                      <div class="size-16 sm:size-20 rounded-full border border-outline/40 bg-accent flex items-center justify-center mb-2 overflow-hidden">
                        <span class="block size-8 rounded-full bg-muted/30"></span>
                      </div>
                      <span class="block h-[0.75em] w-16 rounded-sm bg-accent"></span>
                    </div>
                    <div role="button" tabindex="0" data-category="category-05" class="flex flex-col items-center justify-center p-3 rounded-xl border border-outline/40 hover:border-primary transition-colors text-center group/cat">
                      <div class="size-16 sm:size-20 rounded-full border border-outline/40 bg-accent flex items-center justify-center mb-2 overflow-hidden">
                        <span class="block size-8 rounded-full bg-muted/30"></span>
                      </div>
                      <span class="block h-[0.75em] w-16 rounded-sm bg-accent"></span>
                    </div>
                    <div role="button" tabindex="0" data-category="category-06" class="flex flex-col items-center justify-center p-3 rounded-xl border border-outline/40 hover:border-primary transition-colors text-center group/cat">
                      <div class="size-16 sm:size-20 rounded-full border border-outline/40 bg-accent flex items-center justify-center mb-2 overflow-hidden">
                        <span class="block size-8 rounded-full bg-muted/30"></span>
                      </div>
                      <span class="block h-[0.75em] w-16 rounded-sm bg-accent"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <nav class="flex items-center gap-6">
              <div role="button" tabindex="0" data-destination="home" class="text-xs uppercase tracking-wider ${navLinkCls} ${focusRing}"><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></div>
              <div role="button" tabindex="0" data-destination="about" class="text-xs uppercase tracking-wider ${navLinkCls} ${focusRing}"><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></div>
              <div role="button" tabindex="0" data-destination="contact" class="text-xs uppercase tracking-wider ${navLinkCls} ${focusRing}"><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></div>
            </nav>
            <div class="hidden xl:flex items-center gap-2 text-xs ${navLinkCls}">
              <span class="block size-3 rounded-full bg-accent"></span>
              <span class="block h-[0.75em] w-28 rounded-sm bg-accent"></span>
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
          <div class="my-3 py-2 border-y border-outline/60">
            <button type="button" data-action="toggle-mobile-categories" class="w-full flex justify-between items-center text-sm font-semibold text-content py-2 text-left focus:outline-none">
              <div class="flex items-center gap-2">
                <span class="block size-3.5 rounded-full bg-accent"></span>
                <span class="block h-[0.75em] w-28 rounded-sm bg-accent"></span>
              </div>
              <span data-region="categories-arrow" class="block size-2 rounded-full bg-accent/60 transition-transform"></span>
            </button>
            <div data-region="mobile-categories" hidden class="grid grid-cols-2 gap-2 pt-3">
              <div role="button" tabindex="0" data-category="category-01" class="flex items-center gap-2 rounded-lg p-2 hover:bg-accent/30"><span class="block size-6 rounded-full bg-accent shrink-0"></span><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></div>
              <div role="button" tabindex="0" data-category="category-02" class="flex items-center gap-2 rounded-lg p-2 hover:bg-accent/30"><span class="block size-6 rounded-full bg-accent shrink-0"></span><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></div>
              <div role="button" tabindex="0" data-category="category-03" class="flex items-center gap-2 rounded-lg p-2 hover:bg-accent/30"><span class="block size-6 rounded-full bg-accent shrink-0"></span><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></div>
              <div role="button" tabindex="0" data-category="category-04" class="flex items-center gap-2 rounded-lg p-2 hover:bg-accent/30"><span class="block size-6 rounded-full bg-accent shrink-0"></span><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></div>
              <div role="button" tabindex="0" data-category="category-05" class="flex items-center gap-2 rounded-lg p-2 hover:bg-accent/30"><span class="block size-6 rounded-full bg-accent shrink-0"></span><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></div>
              <div role="button" tabindex="0" data-category="category-06" class="flex items-center gap-2 rounded-lg p-2 hover:bg-accent/30"><span class="block size-6 rounded-full bg-accent shrink-0"></span><span class="block h-[0.75em] w-12 rounded-sm bg-accent"></span></div>
            </div>
          </div>
        </nav>
        <div class="mt-6 flex flex-col items-start gap-3 border-t border-outline px-2 pt-6">
          ${authMobile}
        </div>
      </dialog>`;
  }
}
