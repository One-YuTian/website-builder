import { ViewElement, placeholder, focusRing } from '../shared/markup.js';

const quick = [['home', 'Home'], ['shop', 'Shop'], ['about', 'About'], ['contact', 'Contact']];
const policy = [['terms', 'Terms'], ['privacy', 'Privacy'], ['returns', 'Returns']];

export class FooterBase extends ViewElement {
  navigation(entries) {
    return entries.map(([destination]) => `<a href="#${destination}" data-destination="${destination}" class="inline-block rounded-sm py-2 hover:opacity-70 ${focusRing}">${placeholder('text', '7em', '14px', 'link-label')}</a>`).join('');
  }
  render() {
    const dark = this.constructor.appearance === 'dark';
    this.innerHTML = `<footer class="${dark ? 'bg-secondary text-on-secondary' : 'border-t border-outline bg-surface text-content'} font-sans">
      <div class="content-container pb-4 pt-8">
        <div data-region="footer-columns" class="grid grid-cols-1 gap-8 pb-8 md:grid-cols-3">
          <div class="min-w-0 space-y-5">${placeholder('logo', '144px', '40px', 'logo')}${placeholder('text', '100%', '16px', 'description').replace('kind="text"', 'kind="text" lines="3"')}</div>
          <div class="min-w-0 space-y-4">${placeholder('title', '144px', '18px', 'quick-heading')}<nav class="flex flex-col items-start">${this.navigation(quick)}</nav></div>
          ${!dark ? `<div data-region="mobile-policy" class="space-y-4 md:hidden">${placeholder('title', '144px', '18px', 'policy-heading')}<nav class="flex flex-col items-start">${this.navigation(policy)}</nav></div>` : ''}
          <div class="min-w-0 space-y-5">${placeholder('title', '144px', '18px', 'contact-heading')}
            ${Array.from({ length: dark ? 4 : 3 }, (_, index) => `<div data-region="contact-row" class="flex min-w-0 items-start gap-3">${placeholder('circle', '16px', '16px', 'contact-icon')}<div class="min-w-0 flex-1">${placeholder('text', index === 2 ? '100%' : '75%', index === 2 ? '14px' : '16px', 'contact-text').replace('kind="text"', `kind="text"${index === 2 ? ' lines="3"' : ''}`)}</div></div>`).join('')}
          </div>
        </div>
        <div class="flex flex-col items-center justify-between gap-4 border-t border-outline/40 pt-6 md:flex-row">
          ${placeholder('text', '240px', '14px', 'copyright')}
          <nav data-region="bottom-policy" class="${dark ? 'flex' : 'hidden md:flex'} flex-wrap justify-center gap-x-4">${this.navigation(policy)}</nav>
        </div>
      </div>
    </footer>`;
  }
  bind(signal) {
    this.addEventListener('click', event => {
      const link = event.target.closest('[data-destination]');
      if (!link || !this.contains(link)) return;
      event.preventDefault();
      this.emit('footer-navigate', { destination: link.dataset.destination });
    }, { signal });
  }
}
