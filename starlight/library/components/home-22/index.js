document.addEventListener('DOMContentLoaded', function() {
  // Page-level event coordination for Home-22
  document.addEventListener('product-navigate', function(e) {
    console.log('Home-22 Product Navigation:', e.detail);
  });
});
