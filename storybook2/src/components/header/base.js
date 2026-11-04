import { themeConfig } from '../../config/theme.js';
import { placeholder, focusRing } from '../shared/markup.js';
export { placeholder, focusRing } from '../shared/markup.js';

let sequence = 0;
export const links = [['home', 'Home'], ['shop', 'Shop'], ['about', 'About'], ['contact', 'Contact']];

export class HeaderBase extends HTMLElement {
  static observedAttributes = ['is-logged-in', 'cart-count', 'wishlist-count'];

  constructor() {
    super();
    this._uid = `${this.localName}-${++sequence}`;
    this._searchSuggestions = [];
  }

  get isLoggedIn() { return this.hasAttribute('is-logged-in'); }
  set isLoggedIn(value) { this.toggleAttribute('is-logged-in', Boolean(value)); }
  get cartCount() { return this.count('cart-count'); }
  set cartCount(value) { this.setAttribute('cart-count', String(value)); }
  get wishlistCount() { return this.count('wishlist-count'); }
  set wishlistCount(value) { this.setAttribute('wishlist-count', String(value)); }
  get searchSuggestions() { return this._searchSuggestions.map(item => ({ ...item })); }
  set searchSuggestions(value) {
    this._searchSuggestions = Array.isArray(value) ? value.filter(item => item && typeof item.id === 'string' && item.id.trim()).slice(0, 6).map(item => ({ id: item.id })) : [];
    if (this.isConnected) this.updateSuggestions();
  }

  connectedCallback() {
    this.classList.add('block', 'sticky', 'top-0', 'z-40');
    this.render();
    this._controller?.abort();
    this._controller = new AbortController();
    const { signal } = this._controller;
    this.addEventListener('click', event => this.onClick(event), { signal });
    this.addEventListener('submit', event => this.onSubmit(event), { signal });
    this.addEventListener('input', event => this.onInput(event), { signal });
    this.addEventListener('keydown', event => this.onKeydown(event), { signal });
    this.ownerDocument.addEventListener('pointerdown', event => {
      const panel = this.querySelector('[data-region="account-panel"]');
      const trigger = this.querySelector('[data-action="account"]');
      if (!panel?.contains(event.target) && !trigger?.contains(event.target)) this.closeAccount();
      if (!this.querySelector('form').contains(event.target)) this.hideSuggestions();
    }, { signal });
    this._breakpoint = this.ownerDocument.defaultView.matchMedia(`(min-width: ${themeConfig.breakpoints.md / 16}rem)`);
    this._breakpoint.addEventListener('change', () => {
      this.closeDrawer();
      this.closeAccount();
      this.hideSuggestions();
    }, { signal });
    this.bindDialog();
  }

  disconnectedCallback() {
    this._controller?.abort();
    this.querySelector('dialog')?.close();
  }

  attributeChangedCallback() {
    if (!this.isConnected) return;
    this.closeDrawer();
    this.render();
    this.bindDialog();
  }

  emit(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  count(attribute) {
    const value = Number(this.getAttribute(attribute));
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  }

  navigation(destination, label, mobile = false) {
    return `<a href="#${destination}" data-destination="${destination}" class="${mobile ? 'block rounded-lg px-2 py-3 hover:bg-accent/40' : 'rounded-sm py-2 hover:opacity-75'} ${focusRing}">${placeholder('text', mobile ? '112px' : '64px', mobile ? '18px' : '14px', 'navigation-label')}</a>`;
  }

  action(action, label, region, extra = '', count = 0) {
    return `<button type="button" data-action="${action}" class="relative flex size-10 shrink-0 items-center justify-center rounded-lg hover:bg-on-secondary/10 ${focusRing} ${extra}"${action === 'menu' ? ` aria-controls="${this._uid}-drawer"` : ''}${action === 'account' ? ` aria-controls="${this._uid}-account"` : ''}>
      ${placeholder('circle', '22px', '22px', region)}
      ${count ? `<span data-region="${region}-count" class="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-primary">${placeholder('text', '8px', '10px')}</span>` : ''}
    </button>`;
  }

  bindDialog() {
    this.querySelector('dialog').addEventListener('cancel', event => { event.preventDefault(); this.closeDrawer(); }, { signal: this._controller?.signal });
  }

  onClick(event) {
    const dialog = this.querySelector('dialog');
    if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) this.closeDrawer();
      return;
    }
    const target = event.target.closest('[data-action], [data-destination], [data-product]');
    if (!target || !this.contains(target)) return;
    if (target.hasAttribute('data-destination')) {
      event.preventDefault();
      this.closeDrawer(); this.closeAccount(); this.hideSuggestions();
      this.emit('header-navigate', { destination: target.dataset.destination });
      return;
    }
    if (target.hasAttribute('data-product')) {
      this.hideSuggestions();
      this.emit('header-navigate', { destination: 'product', id: target.dataset.product });
      return;
    }
    switch (target.dataset.action) {
      case 'menu':
        dialog.showModal();
        target.setAttribute('aria-expanded', 'true');
        this.emit('header-menu-change', { open: true });
        break;
      case 'close-menu': this.closeDrawer(); break;
      case 'account':
        if (!this.isLoggedIn || !this._breakpoint.matches) this.emit('header-navigate', { destination: this.isLoggedIn ? 'orders' : 'login' });
        else {
          const panel = this.querySelector('[data-region="account-panel"]');
          panel.hidden = !panel.hidden;
          target.setAttribute('aria-expanded', String(!panel.hidden));
        }
        break;
      case 'wishlist': this.emit('header-navigate', { destination: this.isLoggedIn ? 'wishlist' : 'login' }); break;
      case 'cart': this.emit('header-cart'); break;
      case 'logout': this.closeAccount(); this.closeDrawer(); this.emit('header-logout'); break;
    }
  }

  closeDrawer() {
    const dialog = this.querySelector('dialog');
    if (!dialog?.open) return;
    dialog.close();
    const trigger = this.querySelector('[data-action="menu"]');
    trigger.setAttribute('aria-expanded', 'false');
    if (this.isConnected && !this._breakpoint.matches) trigger.focus();
    this.emit('header-menu-change', { open: false });
  }

  closeAccount() {
    const panel = this.querySelector('[data-region="account-panel"]');
    if (panel) panel.hidden = true;
    this.querySelector('[data-action="account"]')?.setAttribute('aria-expanded', 'false');
  }

  onSubmit(event) {
    if (!event.target.matches('form')) return;
    event.preventDefault();
    const query = this.querySelector('input').value.trim();
    if (query) { this.hideSuggestions(); this.emit('header-search', { query }); }
  }

  onInput(event) {
    if (!event.target.matches('input[name="query"]')) return;
    this.querySelector('[data-region="search-placeholder"]').hidden = Boolean(event.target.value);
    this.emit('header-search-input', { query: event.target.value.trim() });
    this.updateSuggestions();
  }

  hideSuggestions() { this.querySelector('[data-region="search-suggestions"]').hidden = true; }

  updateSuggestions() {
    const panel = this.querySelector('[data-region="search-suggestions"]');
    const query = this.querySelector('input').value.trim();
    panel.replaceChildren();
    panel.hidden = query.length < 2 || !this._searchSuggestions.length;
    if (panel.hidden) return;
    this._searchSuggestions.forEach((item) => {
      const row = this.ownerDocument.createElement('li');
      const button = this.ownerDocument.createElement('button');
      button.type = 'button';
      button.dataset.product = item.id;
      button.className = `flex w-full items-center gap-3 rounded-lg p-3 hover:bg-accent/40 ${focusRing}`;
      button.innerHTML = `${placeholder('image', '40px', '40px', 'suggestion-image')}<span class="grid flex-1 gap-2">${placeholder('text', '75%', '16px', 'suggestion-title')}${placeholder('text', '48px', '14px', 'suggestion-price')}</span>`;
      row.append(button); panel.append(row);
    });
  }

  onKeydown(event) {
    const dialog = this.querySelector('dialog');
    if (event.key === 'Tab' && dialog.open) {
      const controls = [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]')].filter(element => element.getClientRects().length);
      const first = controls[0];
      const last = controls.at(-1);
      const active = this.ownerDocument.activeElement;
      if ((event.shiftKey && active === first) || (!event.shiftKey && active === last) || !dialog.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    }
    if (event.key === 'Escape') {
      const panel = this.querySelector('[data-region="account-panel"]');
      if (panel && !panel.hidden) { this.closeAccount(); this.querySelector('[data-action="account"]').focus(); }
      if (!this.querySelector('[data-region="search-suggestions"]').hidden) { this.hideSuggestions(); this.querySelector('input').focus(); }
    }
    if (event.key === 'ArrowDown' && event.target.matches('input') && !this.querySelector('[data-region="search-suggestions"]').hidden) {
      event.preventDefault();
      this.querySelector('[data-product]')?.focus();
    }
  }
}
