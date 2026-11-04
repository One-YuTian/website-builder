export class ProductList04 extends HTMLElement {
  constructor() {
    super();
    this._products = Array.from({ length: 10 }, (_, i) => ({
      id: `product-${String(i + 1).padStart(2, '0')}`,
      discounted: i % 3 === 0
    }));
    window.$productList = this;
  }

  get products() { return [...this._products]; }
  set products(list) {
    this._products = Array.isArray(list) ? list : [];
    if (this.isConnected) this.render();
  }

  refresh() {
    this.render();
  }

  connectedCallback() {
    this.classList.add('block', 'min-w-0');
    this.render();
  }

  disconnectedCallback() {
    if (window.$productList === this) delete window.$productList;
  }

  render() {
    this.innerHTML = `
      <section class="bg-surface py-8 font-sans text-content border-t border-outline/30">
        <div class="content-container">
          <div data-region="section-title" class="mb-6 flex items-center justify-between">
            <span class="block h-[0.75em] w-52 rounded-sm bg-accent text-xl"></span>
            <span class="block h-[0.75em] w-20 rounded-sm bg-accent"></span>
          </div>
          <div data-region="product-grid" class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            ${this._products.map(p => `
              <product-card product-id="${p.id}" ${p.discounted ? 'discounted' : ''}></product-card>
            `).join('')}
          </div>
        </div>
      </section>`;
  }
}
