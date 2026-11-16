$(function() {
  $('[data-region^="categories-row"]').on('click', '[role="button"]', function(e) {
    e.preventDefault();
    $(this).trigger('category-navigate');
  });
});
