export class Footer extends HTMLElement {
  constructor() {
    super();
    window.$footer = this;
  }

  connectedCallback() {
    this.classList.add('block', 'min-w-0');
    this.render();
    this.bindEvents();
  }

  disconnectedCallback() {
    this._controller?.abort();
    if (window.$footer === this) delete window.$footer;
  }

  emit(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  bindEvents() {
    this._controller?.abort();
    this._controller = new AbortController();
    this.addEventListener('click', (e) => {
      const link = e.target.closest('[data-destination]');
      if (!link || !this.contains(link)) return;
      e.preventDefault();
      this.emit('footer-navigate', { destination: link.dataset.destination });
    }, { signal: this._controller.signal });
  }

  render() {
    const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary';
    const navItem = (dest) => `<a href="#${dest}" data-destination="${dest}" class="inline-block rounded-sm py-2 hover:opacity-70 ${focusRing}"><span class="block h-[0.75em] w-24 rounded-sm bg-accent"></span></a>`;

    this.innerHTML = `
      <footer class="bg-secondary text-on-secondary font-sans">
        <div class="content-container pb-4 pt-8">
          <div data-region="footer-columns" class="grid grid-cols-1 gap-8 pb-8 md:grid-cols-3">
            <div class="min-w-0 space-y-5">
              <span class="relative flex h-10 w-36 items-center justify-center overflow-hidden rounded-xl bg-accent select-none text-xs font-semibold tracking-widest text-muted">LOGO</span>
              <span class="block h-[0.75em] w-full rounded-sm bg-accent"></span>
              <span class="block h-[0.75em] w-4/5 rounded-sm bg-accent"></span>
            </div>
            <div class="min-w-0 space-y-4">
              <span class="block h-[0.75em] w-36 rounded-sm bg-accent mb-4"></span>
              <nav class="flex flex-col items-start">
                ${['home', 'shop', 'about', 'contact'].map(navItem).join('')}
              </nav>
            </div>
            <div class="min-w-0 space-y-5">
              <span class="block h-[0.75em] w-36 rounded-sm bg-accent mb-4"></span>
              ${[0, 1, 2, 3].map(i => `
                <div class="flex min-w-0 items-start gap-3">
                  <span class="block size-4 rounded-full bg-accent shrink-0"></span>
                  <span class="block h-[0.75em] ${i === 2 ? 'w-full' : 'w-3/4'} rounded-sm bg-accent"></span>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="flex flex-col items-center justify-between gap-4 border-t border-outline/40 pt-6 md:flex-row">
            <span class="block h-[0.75em] w-60 rounded-sm bg-accent"></span>
            <nav class="flex flex-wrap justify-center gap-x-4">
              ${['terms', 'privacy', 'returns'].map(navItem).join('')}
            </nav>
          </div>
        </div>
      </footer>`;
  }
}

export { Footer as Footer01 };

