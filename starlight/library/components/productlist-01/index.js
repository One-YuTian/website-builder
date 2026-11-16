$(function() {
  const $container = $('#product-grid-01');
  if (!$container.length) return;

  const products = [
    { id: 'product-01', discounted: true },
    { id: 'product-02', discounted: false },
    { id: 'product-03', discounted: true },
    { id: 'product-04', discounted: false },
    { id: 'product-05', discounted: true },
    { id: 'product-06', discounted: false },
    { id: 'product-07', discounted: true },
    { id: 'product-08', discounted: false }
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