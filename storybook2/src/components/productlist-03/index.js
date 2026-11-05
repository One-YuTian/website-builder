$(function() {
  const $container = $('#product-slider-03');
  if ($container.length) {
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
      const $slide = $('<div class="swiper-slide"></div>');
      const $card = $('<card-01></card-01>').attr('product-id', p.id);
      if (p.discounted) {
        $card.attr('discounted', '');
      }
      $slide.append($card);
      $container.append($slide);
    }
  }

  if (typeof Swiper !== 'undefined' && $('.popular-products-swiper').length) {
    new Swiper('.popular-products-swiper', {
      slidesPerView: 2,
      spaceBetween: 12,
      loop: true,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev'
      },
      breakpoints: {
        640: {
          slidesPerView: 3,
          spaceBetween: 16
        },
        768: {
          slidesPerView: 4,
          spaceBetween: 20
        },
        1024: {
          slidesPerView: 5,
          spaceBetween: 24
        }
      }
    });
  }
});

