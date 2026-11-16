document.addEventListener('DOMContentLoaded', function() {
  // Page-level event coordination for Home-06
  document.addEventListener('product-navigate', function(e) {
    console.log('Home-06 Product Navigation:', e.detail);
  });
});
