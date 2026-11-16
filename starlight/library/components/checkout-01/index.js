$(function() {
  $('[data-action="place-order"]').on('click', function(e) {
    e.preventDefault();
    $(this).trigger('checkout-submit');
  });

  $('input[name="payment-method"]').on('change', function() {
    const method = $(this).val();
    $(this).trigger('payment-method-change', { method });
  });
});
