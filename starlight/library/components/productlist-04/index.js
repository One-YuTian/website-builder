$(function() {
  const $container = $('#product-grid-04');
  if (!$container.length) return;

  const products = [
    { id: 'product-01', discounted: true },
    { id: 'product-02', discounted: false },
    { id: 'product-03', discounted: false },
    { id: 'product-04', discounted: true },
    { id: 'product-05', discounted: false },
    { id: 'product-06', discounted: false },
    { id: 'product-07', discounted: true },
    { id: 'product-08', discounted: false },
    { id: 'product-09', discounted: false },
    { id: 'product-10', discounted: true }
  ];

  $container.empty();
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const $card = $('<card-01></card-01>').attr('product-id', p.id);
    if (p.discounted) {
      $card.attr('discounted', '');
    }
    $container.append($card);
  }
});