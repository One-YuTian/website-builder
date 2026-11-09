export function assemblePage(body: string, title: string, language = 'en') {
  if (/<html\b/i.test(body)) return body;
  const scripts:string[]=[];
  body=body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,script=>{scripts.push(script);return '';});
  const escape = (value: string) => value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
  return `<!doctype html>
<html lang="${escape(language)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.3/font/bootstrap-icons.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/Swiper/10.3.1/swiper-bundle.min.css">
<script src="https://cdn.tailwindcss.com"></script><script src="js/app.js"></script>
<style>body{margin:0;font-family:var(--theme-font,system-ui,sans-serif);background:var(--theme-surface,#fff);color:var(--theme-text,#18251e)}.content-container{width:100%;max-width:var(--content-width,1280px);margin:auto;padding-inline:1rem}.text-truncate-tooltip{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}</style>
</head><body><header-component></header-component>${body}<cart-component></cart-component><footer-component></footer-component>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/Swiper/10.3.1/swiper-bundle.min.js"></script><script src="js/data.js"></script>
<script src="components/header.js"></script><script src="components/footer.js"></script><script src="components/cart.js"></script><script src="components/card.js"></script>${scripts.join('\n')}</body></html>`;
}
