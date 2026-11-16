$(function() {
  if (typeof Swiper !== 'undefined' && $('.flash-sale-swiper-08').length) {
    new Swiper('.flash-sale-swiper-08', {
      slidesPerView: 2,
      spaceBetween: 12,
      navigation: {
        nextEl: '.flash-sale-next-08',
        prevEl: '.flash-sale-prev-08'
      },
      breakpoints: {
        640: { slidesPerView: 2.5, spaceBetween: 14 },
        768: { slidesPerView: 3, spaceBetween: 16 },
        1024: { slidesPerView: 4, spaceBetween: 20 }
      }
    });
  }
});
