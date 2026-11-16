document.addEventListener('DOMContentLoaded', function() {
  // Page-level event coordination for Home-25
  document.addEventListener('product-navigate', function(e) {
    console.log('Home-25 Product Navigation:', e.detail);
  });
});
