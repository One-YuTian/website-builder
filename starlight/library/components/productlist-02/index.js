$(function() {
  const $container = $('#product-grid-02');
  if (!$container.length) return;

  const products = [
    { id: 'product-01', discounted: false },
    { id: 'product-02', discounted: true },
    { id: 'product-03', discounted: false },
    { id: 'product-04', discounted: true },
    { id: 'product-05', discounted: false },
    { id: 'product-06', discounted: true },
    { id: 'product-07', discounted: false },
    { id: 'product-08', discounted: true }
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