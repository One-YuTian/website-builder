$(function() {
  const $container = $('#productsContainer');
  if (!$container.length) return;

  const defaultProducts = [
    { id: 'prod-01', category: 'cat-1', price: 35, discounted: true },
    { id: 'prod-02', category: 'cat-2', price: 75, discounted: false },
    { id: 'prod-03', category: 'cat-1', price: 120, discounted: true },
    { id: 'prod-04', category: 'cat-2', price: 45, discounted: false },
    { id: 'prod-05', category: 'cat-1', price: 180, discounted: true },
    { id: 'prod-06', category: 'cat-2', price: 210, discounted: false }
  ];

  let currentList = [...defaultProducts];
  let isGrid = true;
  let currentCategory = 'all';
  let currentPriceRange = 'all';
  let currentSort = 'relevance';

  function render(list) {
    $container.empty();
    $('#resultsCount').text(list.length);
    list.forEach(item => {
      const card = $(`<card-01 product-id="${item.id}" view-mode="${isGrid ? 'grid' : 'list'}" ${item.discounted ? 'discounted' : ''}></card-01>`);
      $container.append(card);
    });
  }

  function applyFilters() {
    let filtered = defaultProducts.filter(item => {
      if (currentCategory && currentCategory !== 'all' && item.category !== currentCategory) return false;
      if (currentPriceRange === '0-50' && item.price > 50) return false;
      if (currentPriceRange === '50-150' && (item.price < 50 || item.price > 150)) return false;
      if (currentPriceRange === '150+' && item.price <= 150) return false;
      return true;
    });

    if (currentSort === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    }

    currentList = filtered;
    render(currentList);
  }

  // Mobile / Tablet Drawer
  function openDrawer() {
    $('#mobileFilterDrawer').removeClass('hidden');
    $('input[name="mobile-shop12-cat"][value="' + currentCategory + '"]').prop('checked', true);
    $('input[name="mobile-shop12-price"][value="' + currentPriceRange + '"]').prop('checked', true);
  }
  function closeDrawer() {
    $('#mobileFilterDrawer').addClass('hidden');
  }

  $('#mobileFilterBtn').on('click', openDrawer);
  $('#mobileFilterClose, #mobileFilterOverlay').on('click', closeDrawer);

  $('input[name="mobile-shop12-cat"]').on('change', function() {
    currentCategory = $(this).val();
    $('input[name="shop12-cat"][value="' + currentCategory + '"]').prop('checked', true);
    applyFilters();
  });

  $('input[name="mobile-shop12-price"]').on('change', function() {
    currentPriceRange = $(this).val();
    $('input[name="shop12-price"][value="' + currentPriceRange + '"]').prop('checked', true);
    applyFilters();
  });

  $('#mobileClearFilters').on('click', function() {
    currentCategory = 'all';
    currentPriceRange = 'all';
    currentSort = 'relevance';
    $('input[name="mobile-shop12-cat"][value="all"], input[name="shop12-cat"][value="all"]').prop('checked', true);
    $('input[name="mobile-shop12-price"][value="all"], input[name="shop12-price"][value="all"]').prop('checked', true);
    applyFilters();
    closeDrawer();
  });

  // Desktop Filters
  $('input[name="shop12-cat"]').on('change', function() {
    currentCategory = $(this).val();
    applyFilters();
  });

  $('input[name="shop12-price"]').on('change', function() {
    currentPriceRange = $(this).val();
    applyFilters();
  });

  $('#clearFilters').on('click', function() {
    currentCategory = 'all';
    currentPriceRange = 'all';
    currentSort = 'relevance';
    $('input[name="shop12-cat"][value="all"]').prop('checked', true);
    $('input[name="shop12-price"][value="all"]').prop('checked', true);
    applyFilters();
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
    applyFilters();
  });

  $(document).on('click', function(e) {
    if (!$(e.target).closest('[data-dropdown]').length) {
      $('[data-dropdown-menu]').addClass('hidden');
    }
  });

  // Grid / List View Toggle
  $('#gridView').on('click', function() {
    isGrid = true;
    $(this).addClass('bg-accent/60 text-content').removeClass('bg-surface text-muted');
    $('#listView').addClass('bg-surface text-muted').removeClass('bg-accent/60 text-content');
    $container.removeClass('flex flex-col gap-4').addClass('grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6');
    render(currentList);
  });

  $('#listView').on('click', function() {
    isGrid = false;
    $(this).addClass('bg-accent/60 text-content').removeClass('bg-surface text-muted');
    $('#gridView').addClass('bg-surface text-muted').removeClass('bg-accent/60 text-content');
    $container.removeClass('grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6').addClass('flex flex-col gap-4');
    render(currentList);
  });

  render(currentList);
});
