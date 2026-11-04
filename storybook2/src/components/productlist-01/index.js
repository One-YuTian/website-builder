export class ProductList extends HTMLElement {
  constructor() {
    super();
    this._products = Array.from({ length: 8 }, (_, i) => ({
      id: `product-0${i + 1}`,
      discounted: i % 2 === 0
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
      <section class="bg-accent/20 py-6 font-sans text-content">
        <div class="content-container">
          <div data-region="section-title" class="mb-5 flex items-center justify-between">
            <span class="block h-[0.75em] w-48 rounded-sm bg-accent text-xl"></span>
          </div>
          <div data-region="product-grid" class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
            ${this._products.map(p => `
              <product-card product-id="${p.id}" ${p.discounted ? 'discounted' : ''}></product-card>
            `).join('')}
          </div>
        </div>
      </section>`;
  }
}

export { ProductList as ProductList01 };

