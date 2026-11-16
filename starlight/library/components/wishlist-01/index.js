$(function() {
  const $grid = $('#wishlist-grid');
  const $empty = $('#wishlist-empty');
  if (!$grid.length) return;

  const defaultItems = [
    { id: 'wish-01', discounted: true },
    { id: 'wish-02', discounted: false },
    { id: 'wish-03', discounted: true },
    { id: 'wish-04', discounted: false }
  ];

  let items = [...defaultItems];

  function render() {
    $grid.empty();
    if (items.length === 0) {
      $grid.addClass('hidden');
      $empty.removeClass('hidden');
      return;
    }
    $grid.removeClass('hidden');
    $empty.addClass('hidden');

    items.forEach(item => {
      const card = $(`<card-01 product-id="${item.id}" ${item.discounted ? 'discounted' : ''}></card-01>`);
      $grid.append(card);
    });
  }

  $('[data-action="clear-all"]').on('click', function(e) {
    e.preventDefault();
    items = [];
    render();
    $(this).trigger('wishlist-clear');
  });

  $('[data-action="add-all"]').on('click', function(e) {
    e.preventDefault();
    $(this).trigger('wishlist-add-all', { count: items.length });
  });

  $('[data-action="explore"]').on('click', function(e) {
    e.preventDefault();
    items = [...defaultItems];
    render();
  });

  render();
});
