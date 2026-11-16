$(function() {
  $('[data-action="view-orders"]').on('click', function(e) {
    e.preventDefault();
    $(this).trigger('ordersuccess-navigate', { target: 'orders' });
  });

  $('[data-action="continue-shopping"]').on('click', function(e) {
    e.preventDefault();
    $(this).trigger('ordersuccess-navigate', { target: 'shop' });
  });
});
