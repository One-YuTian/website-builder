$(function() {
  const $grid = $('#products-grid');
  if (!$grid.length) return;

  const defaultProducts = [
    { id: 'prod-01', category: 'cat-1', price: 55, discounted: true },
    { id: 'prod-02', category: 'cat-2', price: 110, discounted: false },
    { id: 'prod-03', category: 'cat-3', price: 180, discounted: true },
    { id: 'prod-04', category: 'cat-1', price: 35, discounted: false },
    { id: 'prod-05', category: 'cat-2', price: 240, discounted: true },
    { id: 'prod-06', category: 'cat-3', price: 80, discounted: false },
    { id: 'prod-07', category: 'cat-1', price: 145, discounted: true },
    { id: 'prod-08', category: 'cat-2', price: 65, discounted: false }
  ];

  let currentList = [...defaultProducts];
  let currentCategory = 'all';
  let currentSort = 'default';

  function render(list) {
    $grid.empty();
    $('#product-count').text(list.length);
    list.forEach(item => {
      const card = $(`<card-01 product-id="${item.id}" ${item.discounted ? 'discounted' : ''}></card-01>`);
      $grid.append(card);
    });
  }

  function applyFilters(cat, min, max) {
    currentCategory = cat || currentCategory;

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

  // Mobile / Tablet Drawer Open / Close
  function openDrawer() {
    $('#mobile-filter-drawer').removeClass('hidden');
    $('input[name="mobile-shop-category"][value="' + currentCategory + '"]').prop('checked', true);
  }
  function closeDrawer() {
    $('#mobile-filter-drawer').addClass('hidden');
  }

  $('#mobile-filter-btn').on('click', openDrawer);
  $('#mobile-filter-close, #mobile-filter-overlay').on('click', closeDrawer);

  $('#mobile-apply-btn').on('click', function() {
    const cat = $('input[name="mobile-shop-category"]:checked').val();
    const min = parseFloat($('#mobile-price-min').val());
    const max = parseFloat($('#mobile-price-max').val());
    $('input[name="shop-category"][value="' + cat + '"]').prop('checked', true);
    applyFilters(cat, min, max);
    closeDrawer();
  });

  // Desktop sidebar filters
  $('input[name="shop-category"]').on('change', function() {
    const cat = $(this).val();
    const min = parseFloat($('#shop-price-min').val());
    const max = parseFloat($('#shop-price-max').val());
    applyFilters(cat, min, max);
  });

  $('#shop-apply-btn').on('click', function() {
    const cat = $('input[name="shop-category"]:checked').val();
    const min = parseFloat($('#shop-price-min').val());
    const max = parseFloat($('#shop-price-max').val());
    applyFilters(cat, min, max);
  });

  // Custom Dropdown Sort
  $('[data-dropdown="sort"] [data-dropdown-trigger]').on('click', function(e) {
    e.stopPropagation();
    const $menu = $(this).siblings('[data-dropdown-menu]');
    $('[data-dropdown-menu]').not($menu).addClass('hidden');
    $menu.toggleClass('hidden');
  });

  $('[data-dropdown="sort"] [data-dropdown-menu] [data-value]').on('click', function() {
    currentSort = $(this).data('value');
    $(this).closest('[data-dropdown-menu]').addClass('hidden');
    const min = parseFloat($('#shop-price-min').val());
    const max = parseFloat($('#shop-price-max').val());
    applyFilters(currentCategory, min, max);
  });

  $(document).on('click', function(e) {
    if (!$(e.target).closest('[data-dropdown]').length) {
      $('[data-dropdown-menu]').addClass('hidden');
    }
  });

  render(currentList);
});
