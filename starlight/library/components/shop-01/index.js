$(function() {
  const $grid = $('#products-grid');
  if (!$grid.length) return;

  const defaultProducts = [
    { id: 'prod-01', price: 120, rating: 5, discounted: true },
    { id: 'prod-02', price: 85, rating: 4, discounted: false },
    { id: 'prod-03', price: 210, rating: 5, discounted: true },
    { id: 'prod-04', price: 45, rating: 3, discounted: false },
    { id: 'prod-05', price: 160, rating: 4, discounted: true },
    { id: 'prod-06', price: 95, rating: 5, discounted: false },
    { id: 'prod-07', price: 320, rating: 5, discounted: true },
    { id: 'prod-08', price: 70, rating: 4, discounted: false }
  ];

  let products = [...defaultProducts];

  function render(list) {
    $grid.empty();
    $('#products-count').text(list.length);
    list.forEach(item => {
      const card = $(`<card-01 product-id="${item.id}" ${item.discounted ? 'discounted' : ''}></card-01>`);
      $grid.append(card);
    });
  }

  $('[data-dropdown="sort"] [data-dropdown-trigger]').on('click', function(e) {
    e.stopPropagation();
    const $menu = $(this).siblings('[data-dropdown-menu]');
    $('[data-dropdown-menu]').not($menu).addClass('hidden');
    $menu.toggleClass('hidden');
  });

  $('[data-dropdown="sort"] [data-dropdown-menu] [data-value]').on('click', function() {
    const val = $(this).data('value');
    $(this).closest('[data-dropdown-menu]').addClass('hidden');

    if (val === 'asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (val === 'desc') {
      products.sort((a, b) => b.price - a.price);
    } else {
      products = [...defaultProducts];
    }
    render(products);
  });

  $(document).on('click', function(e) {
    if (!$(e.target).closest('[data-dropdown]').length) {
      $('[data-dropdown-menu]').addClass('hidden');
    }
  });

  render(products);
});
