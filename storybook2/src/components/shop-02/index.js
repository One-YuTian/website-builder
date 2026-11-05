$(function() {
  const $grid = $('#products-grid');
  if (!$grid.length) return;

  const defaultProducts = [
    { id: 'prod-01', category: 'cat-1', price: 49, discounted: true },
    { id: 'prod-02', category: 'cat-2', price: 99, discounted: false },
    { id: 'prod-03', category: 'cat-1', price: 159, discounted: true },
    { id: 'prod-04', category: 'cat-3', price: 29, discounted: false },
    { id: 'prod-05', category: 'cat-2', price: 199, discounted: true },
    { id: 'prod-06', category: 'cat-3', price: 79, discounted: false }
  ];

  let currentList = [...defaultProducts];
  let currentCategory = 'all';
  let currentSort = 'default';

  function render(list) {
    $grid.empty();
    $('#products-count').text(list.length);
    list.forEach(item => {
      const card = $(`<card-01 product-id="${item.id}" ${item.discounted ? 'discounted' : ''}></card-01>`);
      $grid.append(card);
    });
  }

  function applyFilters() {
    const min = parseFloat($('#price-min').val());
    const max = parseFloat($('#price-max').val());

    let filtered = defaultProducts.filter(item => {
      if (currentCategory && currentCategory !== 'all' && item.category !== currentCategory) return false;
      if (!isNaN(min) && item.price < min) return false;
      if (!isNaN(max) && item.price > max) return false;
      return true;
    });

    if (currentSort === 'asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'desc') {
      filtered.sort((a, b) => b.price - a.price);
    }

    currentList = filtered;
    render(currentList);
  }

  // Mobile/Tablet Filter Accordion Toggle
  $('#mobile-filters-toggle').on('click', function() {
    const $sidebar = $('#filters-sidebar');
    const isHidden = $sidebar.hasClass('hidden');
    if (isHidden) {
      $sidebar.removeClass('hidden');
      $('#filter-chevron').addClass('rotate-225 -translate-y-0.5').removeClass('rotate-45');
    } else {
      $sidebar.addClass('hidden');
      $('#filter-chevron').removeClass('rotate-225 -translate-y-0.5').addClass('rotate-45');
    }
  });

  // Custom Dropdown Open/Close
  $('[data-dropdown] [data-dropdown-trigger]').on('click', function(e) {
    e.stopPropagation();
    const $menu = $(this).siblings('[data-dropdown-menu]');
    $('[data-dropdown-menu]').not($menu).addClass('hidden');
    $menu.toggleClass('hidden');
  });

  // Category Dropdown Selection
  $('[data-dropdown="category"] [data-dropdown-menu] [data-value]').on('click', function() {
    currentCategory = $(this).data('value');
    $(this).closest('[data-dropdown-menu]').addClass('hidden');
    applyFilters();
  });

  // Sort Dropdown Selection
  $('[data-dropdown="sort"] [data-dropdown-menu] [data-value]').on('click', function() {
    currentSort = $(this).data('value');
    $(this).closest('[data-dropdown-menu]').addClass('hidden');
    applyFilters();
  });

  // Apply Button
  $('#apply-filters-btn').on('click', function() {
    applyFilters();
    if ($(window).width() < 1024) {
      $('#filters-sidebar').addClass('hidden');
      $('#filter-chevron').removeClass('rotate-225 -translate-y-0.5').addClass('rotate-45');
    }
  });

  $(document).on('click', function(e) {
    if (!$(e.target).closest('[data-dropdown]').length) {
      $('[data-dropdown-menu]').addClass('hidden');
    }
  });

  render(currentList);
});
