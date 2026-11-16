$(function() {
  $('[data-region="coupons-grid"]').on('click', '[role="button"]', function(e) {
    e.preventDefault();
    $(this).trigger('coupon-claim');
  });
});
