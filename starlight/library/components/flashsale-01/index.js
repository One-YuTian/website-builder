$(function() {
  if (typeof Swiper !== 'undefined' && $('.flash-sale-swiper-01').length) {
    new Swiper('.flash-sale-swiper-01', {
      slidesPerView: 2,
      spaceBetween: 12,
      navigation: {
        nextEl: '.flash-sale-next-01',
        prevEl: '.flash-sale-prev-01'
      },
      breakpoints: {
        640: { slidesPerView: 3, spaceBetween: 14 },
        768: { slidesPerView: 3, spaceBetween: 16 },
        1024: { slidesPerView: 4, spaceBetween: 18 },
        1280: { slidesPerView: 5, spaceBetween: 20 }
      }
    });
  }
});
