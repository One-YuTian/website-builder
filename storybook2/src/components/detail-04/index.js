$(function() {
  const $qtyInput = $('#qty-input');
  if (!$qtyInput.length) return;

  $('#qty-minus').on('click', function() {
    let val = parseInt($qtyInput.val(), 10) || 1;
    if (val > 1) $qtyInput.val(val - 1);
  });

  $('#qty-plus').on('click', function() {
    let val = parseInt($qtyInput.val(), 10) || 1;
    if (val < 99) $qtyInput.val(val + 1);
  });

  let currentImg = 1;
  const totalImgs = 8;

  let thumbnailsSwiper = null;
  if (typeof Swiper !== 'undefined' && $('.thumbnails-swiper').length) {
    thumbnailsSwiper = new Swiper('.thumbnails-swiper', {
      slidesPerView: 'auto',
      spaceBetween: 8,
      freeMode: true,
      watchSlidesProgress: true
    });
  }

  function updateBadge() {
    $('#image-counter-badge').text(`${currentImg} / ${totalImgs}`);
    $('[data-region="gallery"] [role="button"]').removeClass('border-2 border-primary').addClass('border-2 border-transparent hover:border-primary/50');
    $('[data-region="gallery"] [role="button"]').eq(currentImg - 1).removeClass('border-2 border-transparent hover:border-primary/50').addClass('border-2 border-primary');
    thumbnailsSwiper?.slideTo(currentImg - 1);
  }

  $('#prev-image-btn').on('click', function() {
    currentImg = currentImg > 1 ? currentImg - 1 : totalImgs;
    updateBadge();
  });

  $('#next-image-btn').on('click', function() {
    currentImg = currentImg < totalImgs ? currentImg + 1 : 1;
    updateBadge();
  });

  $('[data-region="gallery"] [role="button"]').on('click', function() {
    currentImg = $(this).closest('.swiper-slide').index() + 1;
    updateBadge();
  });

  $('#add-to-cart-btn, #buy-now-btn').on('click', function() {
    const event = new CustomEvent('product-navigate', {
      bubbles: true,
      composed: true,
      detail: { action: $(this).attr('id'), quantity: parseInt($qtyInput.val(), 10) || 1 }
    });
    this.dispatchEvent(event);
  });

  // Tab switching
  $('#product-tabs-nav .tab-btn').on('click', function() {
    const tab = $(this).data('tab');
    $('#product-tabs-nav .tab-btn').removeClass('border-primary text-primary').addClass('border-transparent text-muted');
    $(this).addClass('border-primary text-primary').removeClass('border-transparent text-muted');

    $('.tab-panel').addClass('hidden');
    $('#' + tab + '-panel').removeClass('hidden');
  });

  // Collapsible sections (Description, Specifications, Reviews)
  $('.collapsible-toggle').on('click', function() {
    const $toggle = $(this);
    const $container = $toggle.closest('.relative');
    const $content = $container.find('.collapsible-content');
    const $fade = $container.find('.collapsible-fade');
    const $chevron = $toggle.find('span');
    const isExpanded = $content.hasClass('max-h-none');

    if (isExpanded) {
      $content.removeClass('max-h-none overflow-visible');
      $fade.removeClass('opacity-0 pointer-events-none');
      $chevron.removeClass('-rotate-135').addClass('rotate-45');
    } else {
      $content.addClass('max-h-none overflow-visible');
      $fade.addClass('opacity-0 pointer-events-none');
      $chevron.removeClass('rotate-45').addClass('-rotate-135');
    }
  });
});
