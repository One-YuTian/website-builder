$(function() {
  $('[data-region="brand-grid"]').on('click', '[role="button"]', function(e) {
    e.preventDefault();
    $(this).trigger('category-navigate');
  });
});
