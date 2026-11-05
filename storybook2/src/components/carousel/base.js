import { ViewElement, placeholder, focusRing, escapeAttribute } from '../shared/markup.js';
import { themeConfig } from '../../config/theme.js';

const normalize = value => Array.isArray(value) ? value.filter(item => item && typeof item.id === 'string' && item.id.trim()).slice(0, 12).map(item => ({ id: item.id })) : [];

export class CarouselBase extends ViewElement {
  static observedAttributes = ['active-index', 'paused', 'interval'];
  constructor() {
    super();
    this._slides = Array.from({ length: this.constructor.mobile && this.constructor.composite ? 3 : 2 }, (_, index) => ({ id: `banner-0${index + 1}` }));
    this._categories = Array.from({ length: 6 }, (_, index) => ({ id: `category-${String(index + 1).padStart(2, '0')}` }));
  }
  get slides() { return this._slides.map(item => ({ ...item })); }
  set slides(value) { this._slides = normalize(value); this.activeIndex = 0; if (this.isConnected) this.render(); }
  get categories() { return this._categories.map(item => ({ ...item })); }
  set categories(value) { this._categories = normalize(value); if (this.isConnected) this.render(); }
  get activeIndex() {
    const number = Number.parseInt(this.getAttribute('active-index'), 10) || 0;
    return this._slides.length ? ((number % this._slides.length) + this._slides.length) % this._slides.length : 0;
  }
  set activeIndex(value) { this.setAttribute('active-index', String(Number.parseInt(value, 10) || 0)); }
  get paused() { return this.hasAttribute('paused'); }
  set paused(value) { this.toggleAttribute('paused', Boolean(value)); }
  get interval() { const value = Number(this.getAttribute('interval')); return Number.isFinite(value) && value >= 500 ? value : 2500; }
  set interval(value) { this.setAttribute('interval', String(value)); }
  connectedCallback() {
    const view = this.ownerDocument.defaultView;
    this._desktop = view.matchMedia(`(min-width: ${themeConfig.breakpoints.lg / 16}rem)`);
    this._reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
    super.connectedCallback();
    this.classList.add(...(this.constructor.mobile ? ['lg:hidden'] : ['hidden', 'lg:block']));
  }
  disconnectedCallback() { clearInterval(this._timer); this._hovered = this._focused = false; super.disconnectedCallback(); }
  attributeChangedCallback(name, previous, value) {
    if (!this.isConnected || previous === value) return;
    this.updateActive();
    this.startTimer();
  }
  render() {
    const composite = this.constructor.composite;
    const mobile = this.constructor.mobile;
    const stageSize = mobile ? (composite ? 'aspect-[60/17]' : 'aspect-[50/21]') : (composite ? 'h-[250px]' : 'h-[550px]');
    const stage = `<div data-region="carousel-stage" tabindex="0" class="relative ${stageSize} overflow-hidden rounded-xl touch-pan-y ${focusRing}">
      ${this._slides.map((item, index) => `<div data-slide="${index}"${index !== this.activeIndex ? ' hidden' : ''} class="absolute inset-0">${placeholder('image', '100%', '100%', 'slide-image')}</div>`).join('')}
      ${!composite && !mobile ? '<div class="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-surface/80"></div>' : ''}
      <div data-region="pagination" class="absolute inset-x-0 ${mobile ? 'bottom-2' : 'bottom-5'} flex items-center justify-center gap-3">
        ${this._slides.map((item, index) => `<button type="button" data-index="${index}" class="flex size-8 items-center justify-center rounded-full ${focusRing}"><span class="size-2 rounded-full ${index === this.activeIndex ? 'bg-primary' : 'bg-muted/50'}"></span></button>`).join('')}
      </div>
      ${this._slides.length > 1 ? `<button type="button" data-pause class="absolute right-3 top-3 flex size-9 items-center justify-center rounded-lg border border-outline bg-surface/80 ${focusRing}">${placeholder('circle', '14px', '14px')}</button>` : ''}
    </div>`;
    this.innerHTML = `<section data-layout="${mobile ? 'mobile' : 'desktop'}" class="bg-surface font-sans text-content ${composite && !mobile ? 'py-8' : 'pb-6'}"><div class="content-container">
      ${composite && !mobile ? `<div class="grid grid-cols-3 gap-2"><div class="col-span-2 min-w-0">${stage}</div><div data-region="side-banners" class="grid h-[250px] grid-rows-2 gap-2">${placeholder('image', '100%', '100%', 'side-image')}${placeholder('image', '100%', '100%', 'side-image')}</div></div>
      <nav data-region="categories" class="mt-6 grid grid-cols-3 gap-4 md:grid-cols-6">${this._categories.map(item => `<div role="button" tabindex="0" data-category="${escapeAttribute(item.id)}" class="flex min-w-0 flex-wrap items-center gap-3 rounded-lg border border-outline/60 bg-surface p-2 hover:bg-accent/20 cursor-pointer ${focusRing}">${placeholder('image', '40px', '40px', 'category-image')}${placeholder('text', '64px', '14px', 'category-label')}</div>`).join('')}</nav>` : stage}
      ${composite && mobile ? `<nav data-region="mobile-categories" class="mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2">${this._categories.map(item => `<div role="button" tabindex="0" data-category="${escapeAttribute(item.id)}" class="flex min-w-0 shrink-0 basis-[calc((100%_-_30px)/3.5)] snap-start flex-col items-center gap-3 rounded-lg border border-outline/60 p-2 md:p-4 cursor-pointer ${focusRing}">${placeholder('image', '56px', '56px', 'category-image')}${placeholder('text', '64px', '12px', 'category-label')}</div>`).join('')}</nav>` : ''}
    </div></section>`;
    this.updateActive();
    this.startTimer();
  }
  updateActive() {
    this.dataset.activeIndex = String(this.activeIndex);
    this.querySelectorAll('[data-slide]').forEach(element => { element.hidden = Number(element.dataset.slide) !== this.activeIndex; });
    this.querySelectorAll('[data-index]').forEach(button => {
      const active = Number(button.dataset.index) === this.activeIndex;
      button.setAttribute('aria-current', String(active));
      button.firstElementChild.className = `size-2 rounded-full ${active ? 'bg-primary' : 'bg-muted/50'}`;
    });
    const toggle = this.querySelector('[data-pause]');
    toggle?.setAttribute('aria-pressed', String(this.paused));
  }
  startTimer() {
    clearInterval(this._timer);
    const visibleViewport = this._desktop && (this.constructor.mobile ? !this._desktop.matches : this._desktop.matches);
    if (!this.isConnected || this.paused || this._hovered || this._focused || !visibleViewport || this._reduced?.matches || this.ownerDocument.hidden || this._slides.length < 2) return;
    this._timer = setInterval(() => this.goTo(this.activeIndex + 1), this.interval);
  }
  goTo(index) {
    const previous = this.activeIndex;
    this.activeIndex = index;
    if (this.activeIndex !== previous) this.emit('carousel-change', { activeIndex: this.activeIndex });
  }
  bind(signal) {
    this.addEventListener('click', event => {
      const dot = event.target.closest('[data-index]');
      if (dot && this.contains(dot)) this.goTo(Number(dot.dataset.index));
      const pause = event.target.closest('[data-pause]');
      if (pause && this.contains(pause)) this.paused = !this.paused;
      const link = event.target.closest('[data-category]');
      if (link && this.contains(link)) { event.preventDefault(); this.emit('carousel-navigate', { categoryId: link.dataset.category }); }
    }, { signal });
    this.addEventListener('keydown', event => {
      if (!event.target.closest('[data-region="carousel-stage"]')) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); this.goTo(this.activeIndex + (event.key === 'ArrowRight' ? 1 : -1)); }
    }, { signal });
    this.addEventListener('pointerdown', event => { if (event.target.closest('[data-region="carousel-stage"]')) this._pointer = { x: event.clientX, y: event.clientY }; }, { signal });
    this.addEventListener('pointerup', event => {
      if (!this._pointer) return;
      const x = event.clientX - this._pointer.x; const y = event.clientY - this._pointer.y;
      this._pointer = null;
      if (Math.abs(x) > 40 && Math.abs(x) > Math.abs(y)) this.goTo(this.activeIndex + (x < 0 ? 1 : -1));
    }, { signal });
    this.addEventListener('pointercancel', () => { this._pointer = null; }, { signal });
    this.addEventListener('pointerenter', () => { this._hovered = true; this.startTimer(); }, { signal });
    this.addEventListener('pointerleave', () => { this._hovered = false; this._pointer = null; this.startTimer(); }, { signal });
    this.addEventListener('focusin', () => { this._focused = true; this.startTimer(); }, { signal });
    this.addEventListener('focusout', event => { this._focused = this.contains(event.relatedTarget); this.startTimer(); }, { signal });
    this._desktop.addEventListener('change', () => this.startTimer(), { signal });
    this._reduced.addEventListener('change', () => this.startTimer(), { signal });
    this.ownerDocument.addEventListener('visibilitychange', () => this.startTimer(), { signal });
  }
}
