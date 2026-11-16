document.addEventListener('DOMContentLoaded', function() {
  // Page-level event coordination for Home-23
  document.addEventListener('product-navigate', function(e) {
    console.log('Home-23 Product Navigation:', e.detail);
  });
});
