// Preview response only: no changes to SDK source or production browser storage.
export const previewMock = String.raw`<script>
(() => {
  if (!window.__websiteBuilderMockFrame) return;
  let sdk;
  const wrap = value => {
    if (!value || typeof value.init !== 'function' || value.__previewMockWrapped) return value;
    const initialize = value.init;
    value.init = function(data, config) {
      const fallback = [
        {id:'PREVIEW001',name:'Preview product',price:49.9,final_price:49.9,category:'Preview',main_image:'',images:[]},
        {id:'PREVIEW002',name:'Preview accessory',price:24.9,final_price:24.9,category:'Preview',main_image:'',images:[]}
      ];
      const products = Array.isArray(data) && data.length ? data : Array.isArray(window.productData) && window.productData.length ? window.productData : fallback;
      const result = initialize.call(this, products, config);
      const app = window.APP;
      if (!app?.account || !app?.cart || !app?.wishlist) return result;

      if (localStorage.getItem('user') === null) localStorage.setItem('user', JSON.stringify({id:'preview-user',username:'Preview',email:'preview@example.invalid',ext:{preview:true}}));
      const user = app.account.current();
      const items = products.filter(p => p && p.id).slice(0, 2);
      if (user && localStorage.getItem('cart:' + user.id) === null) for (const p of items) app.cart.add({id:p.id,name:p.name,image:p.main_image||p.image||'',price:Number(p.final_price??p.price)||0},1);
      if (user && localStorage.getItem('wishlist:' + user.id) === null) for (const p of items) app.wishlist.add(p.id);
      const path = window.__websiteBuilderLocation.pathname.split('/').pop().split('.')[0];
      if (user && ['orders','order','order-confirmation'].includes(path) && localStorage.getItem('orders') === null && app.order?.create && app.cart.list().length) {
        const savedCart = localStorage.getItem('cart:' + user.id);
        app.order.create({notes:'Preview Mock order',ext:{preview:true}});
        if(savedCart!==null)localStorage.setItem('cart:' + user.id,savedCart);
      }
      window.__websiteBuilderMockReady = true;
      return result;
    };
    Object.defineProperty(value,'__previewMockWrapped',{value:true});
    return value;
  };
  Object.defineProperty(window,'SDK',{configurable:true,get:()=>sdk,set:value=>{sdk=wrap(value);}});
})();
</script>`;
