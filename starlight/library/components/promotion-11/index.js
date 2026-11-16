$(function() {
  $('[data-region="coupon-cards"]').on('click', '[role="button"]', function(e) {
    e.preventDefault();
    $(this).trigger('coupon-claim');
  });
});
