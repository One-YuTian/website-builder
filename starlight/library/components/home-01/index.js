document.addEventListener('DOMContentLoaded', function() {
  // Page-level event coordination for Home-01
  document.addEventListener('product-navigate', function(e) {
    console.log('Home-01 Product Navigation:', e.detail);
  });
});
