document.addEventListener('DOMContentLoaded', function() {
  // Page-level event coordination for Home-26
  document.addEventListener('product-navigate', function(e) {
    console.log('Home-26 Product Navigation:', e.detail);
  });
});
