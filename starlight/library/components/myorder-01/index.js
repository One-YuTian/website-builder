$(function() {
  // Action buttons events
  $('[data-action="view-details"]').on('click', function(e) {
    e.preventDefault();
    const orderId = $(this).closest('.order-card').find('.font-mono').text() || 'ORD-2026-9812';
    $(this).trigger('order-navigate', { action: 'view-details', orderId: orderId });
  });

  $('[data-action="buy-again"]').on('click', function(e) {
    e.preventDefault();
    $(this).trigger('order-navigate', { action: 'buy-again' });
  });

  $('[data-action="continue-shopping"]').on('click', function(e) {
    e.preventDefault();
    $(this).trigger('order-navigate', { action: 'continue-shopping' });
  });
});
