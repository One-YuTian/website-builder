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

  let thumbnailsSwiper = null;
  if (typeof Swiper !== 'undefined' && $('.thumbnails-swiper').length) {
    thumbnailsSwiper = new Swiper('.thumbnails-swiper', {
      slidesPerView: 'auto',
      spaceBetween: 8,
      freeMode: true,
      watchSlidesProgress: true
    });
  }

  $('#thumb-prev').on('click', function() {
    thumbnailsSwiper?.slidePrev();
  });

  $('#thumb-next').on('click', function() {
    thumbnailsSwiper?.slideNext();
  });

  $('[data-region="gallery"] [role="button"]').on('click', function() {
    $('[data-region="gallery"] [role="button"]').removeClass('border-2 border-primary').addClass('border border-outline/50');
    $(this).removeClass('border border-outline/50').addClass('border-2 border-primary');
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
    setTimeout(updateCollapsibles, 50);
  });

  // Dynamic collapsible panels (Description, Specifications, Reviews)
  function updateCollapsibles() {
    $('.collapsible-content').each(function() {
      const $content = $(this);
      const $container = $content.closest('.relative');
      const $fade = $container.find('.collapsible-fade');
      const $toggle = $container.find('.collapsible-toggle');
      // Only show toggle and fade overlay if content height exceeds the container threshold
      if (this.scrollHeight > this.clientHeight + 4) {
        $toggle.removeClass('hidden').addClass('flex');
        if (!$content.hasClass('max-h-none')) {
          $fade.removeClass('hidden');
        }
      } else if (!$content.hasClass('max-h-none')) {
        $toggle.addClass('hidden').removeClass('flex');
        $fade.addClass('hidden');
      }
    });
  }

  setTimeout(updateCollapsibles, 50);

  // Bidirectional toggle support (Expand / Collapse)
  $('.collapsible-toggle').on('click', function() {
    const $toggle = $(this);
    const $container = $toggle.closest('.relative');
    const $content = $container.find('.collapsible-content');
    const $fade = $container.find('.collapsible-fade');
    const $chevron = $toggle.find('span');
    const isExpanded = $content.hasClass('max-h-none');

    if (isExpanded) {
      $content.removeClass('max-h-none overflow-visible');
      $fade.removeClass('opacity-0 pointer-events-none hidden');
      $chevron.removeClass('-rotate-135').addClass('rotate-45');
    } else {
      $content.addClass('max-h-none overflow-visible');
      $fade.addClass('opacity-0 pointer-events-none hidden');
      $chevron.removeClass('rotate-45').addClass('-rotate-135');
    }
  });
});
