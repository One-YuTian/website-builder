document.addEventListener('DOMContentLoaded', function() {
  // Page-level event coordination for Home-13
  document.addEventListener('product-navigate', function(e) {
    console.log('Home-13 Product Navigation:', e.detail);
  });
});
