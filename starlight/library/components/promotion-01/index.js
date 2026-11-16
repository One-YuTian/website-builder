$(function() {
  $('[data-region="promo-grid"]').on('click', '[role="button"]', function(e) {
    e.preventDefault();
    $(this).trigger('promotion-navigate');
  });
});
