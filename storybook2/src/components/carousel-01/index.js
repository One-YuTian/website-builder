export class Carousel extends HTMLElement {
  static observedAttributes = ['active-index', 'paused', 'interval'];

  constructor() {
    super();
    this._slides = [{ id: 'banner-01' }, { id: 'banner-02' }];
    window.$carousel = this;
  }

  get activeIndex() { return Number(this.getAttribute('active-index')) || 0; }
  set activeIndex(val) { this.setAttribute('active-index', String(Number(val) || 0)); }

  get paused() { return this.hasAttribute('paused'); }
  set paused(val) { this.toggleAttribute('paused', Boolean(val)); }

  get interval() { return Number(this.getAttribute('interval')) || 3000; }
  set interval(val) { this.setAttribute('interval', String(val)); }

  next() { this.goTo(this.activeIndex + 1); }
  prev() { this.goTo(this.activeIndex - 1); }
  goTo(index) {
    const total = this._slides.length;
    this.activeIndex = total ? ((index % total) + total) % total : 0;
    this.updateActive();
    this.emit('carousel-change', { activeIndex: this.activeIndex });
  }

  connectedCallback() {
    this.classList.add('block', 'min-w-0');
    this.render();
    this.bindEvents();
    this.startTimer();
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    this._controller?.abort();
    if (window.$carousel === this) delete window.$carousel;
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this.updateActive();
      this.startTimer();
    }
  }

  emit(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  startTimer() {
    clearInterval(this._timer);
    if (this.paused || this._slides.length < 2) return;
    this._timer = setInterval(() => this.next(), this.interval);
  }

  updateActive() {
    this.querySelectorAll('[data-slide]').forEach((el, i) => {
      el.hidden = i !== this.activeIndex;
    });
    this.querySelectorAll('[data-index]').forEach((btn, i) => {
      const active = i === this.activeIndex;
      btn.firstElementChild.className = `size-2 rounded-full ${active ? 'bg-primary' : 'bg-muted/50'}`;
    });
  }

  bindEvents() {
    this._controller?.abort();
    this._controller = new AbortController();
    const { signal } = this._controller;

    this.addEventListener('click', (e) => {
      const dot = e.target.closest('[data-index]');
      if (dot) this.goTo(Number(dot.dataset.index));
      const pauseBtn = e.target.closest('[data-pause]');
      if (pauseBtn) this.paused = !this.paused;
    }, { signal });

    this.addEventListener('pointerenter', () => clearInterval(this._timer), { signal });
    this.addEventListener('pointerleave', () => this.startTimer(), { signal });
  }

  render() {
    const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary';

    this.innerHTML = `
      <section class="bg-surface font-sans text-content pb-6">
        <div class="content-container">
          <div data-region="carousel-stage" class="relative h-[320px] md:h-[480px] overflow-hidden rounded-xl touch-pan-y ${focusRing}">
            ${this._slides.map((_, index) => `
              <div data-slide="${index}" ${index !== this.activeIndex ? 'hidden' : ''} class="absolute inset-0 bg-accent flex items-center justify-center">
                <span class="relative block aspect-[6/5] w-1/4 min-w-8 max-w-20 overflow-hidden rounded-sm border border-muted">
                  <span class="absolute right-[15%] top-[15%] size-1/5 rounded-full bg-muted"></span>
                  <span class="absolute -bottom-1/4 left-[5%] size-3/4 rotate-45 border-l border-t border-muted"></span>
                  <span class="absolute -bottom-1/4 right-0 size-1/2 rotate-45 border-l border-t border-muted"></span>
                </span>
              </div>
            `).join('')}
            <div data-region="pagination" class="absolute inset-x-0 bottom-4 flex items-center justify-center gap-3">
              ${this._slides.map((_, index) => `
                <button type="button" data-index="${index}" class="flex size-8 items-center justify-center rounded-full ${focusRing}">
                  <span class="size-2 rounded-full ${index === this.activeIndex ? 'bg-primary' : 'bg-muted/50'}"></span>
                </button>
              `).join('')}
            </div>
            <button type="button" data-pause class="absolute right-3 top-3 flex size-9 items-center justify-center rounded-lg border border-outline bg-surface/80 ${focusRing}">
              <span class="block size-3.5 rounded-full bg-accent"></span>
            </button>
          </div>
        </div>
      </section>`;
    this.updateActive();
  }
}

export { Carousel as Carousel01 };

