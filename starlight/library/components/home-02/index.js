document.addEventListener('DOMContentLoaded', function() {
  // Page-level event coordination for Home-02
  document.addEventListener('product-navigate', function(e) {
    console.log('Home-02 Product Navigation:', e.detail);
  });
});
