document.addEventListener('DOMContentLoaded', function() {
  // Page-level event coordination for Home-21
  document.addEventListener('product-navigate', function(e) {
    console.log('Home-21 Product Navigation:', e.detail);
  });
});
