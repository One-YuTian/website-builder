import { posix } from 'node:path';

export function injectSharedUI(html:string,path:string) {
  if(!/<html\b/i.test(html)||!/<\/body>/i.test(html)||!/<\/html>\s*$/i.test(html))return html;
  if(!/<head\b/i.test(html))html=html.replace(/<html\b[^>]*>/i,match=>`${match}<head></head>`);
  const src=posix.relative(posix.dirname(path),'components/toast.js');
  if(!/<script\b[^>]*\bsrc\s*=\s*["'][^"']*\bcomponents\/toast\.js["']/i.test(html))html=html.replace(/<head\b[^>]*>/i,match=>`${match}\n<script src="${src}"></script>`);
  if(!/<toast-component\b/i.test(html))html=html.replace(/<\/body>/i,'<toast-component></toast-component>\n</body>');
  return html;
}

export function assemblePage(body: string, title: string, language = 'en', options:{commerce?:boolean;commerceConfig?:boolean;cart?:'page'|'drawer'|'none'}={}) {
  if (/<html\b/i.test(body)) return body;
  const scripts:string[]=[];
  body=body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,script=>{scripts.push(script);return '';});
  const links: string[] = [];
  body = body.replace(/<link\b[^>]*>/gi, link => { links.push(link); return ''; });
  const escape = (value: string) => value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
  const drawer = options.cart === 'drawer' && !/<cart-component\b/i.test(body) ? '<cart-component view-mode="drawer"></cart-component>' : '';
  return `<!doctype html>
<html lang="${escape(language)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.3/font/bootstrap-icons.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/Swiper/10.3.1/swiper-bundle.min.css">
${links.join('\n')}
<script src="https://cdn.tailwindcss.com"></script><script src="js/app.js"></script>
</head><body class="m-0 bg-surface font-sans text-content antialiased"><header-component></header-component>${body}${drawer}<footer-component></footer-component>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/Swiper/10.3.1/swiper-bundle.min.js"></script>${options.commerceConfig?'<script src="js/commerce-config.js"></script>':''}${options.commerce?'<script src="js/ec-sdk.js"></script><script src="js/sdk.js"></script>':''}<script src="js/data.js"></script>
${options.commerce?'<script>window.SDK.init(window.productData, window.commerceConfig || {});</script>':''}
<script src="components/header.js"></script><script src="components/footer.js"></script>${options.cart && options.cart !== 'none'?'<script src="components/cart.js"></script>':''}<script src="components/card.js"></script>${scripts.join('\n')}</body></html>`;
}
