$(function() {
  if (typeof Swiper !== 'undefined' && $('.category-swiper-06').length) {
    new Swiper('.category-swiper-06', {
      slidesPerView: 2,
      spaceBetween: 14,
      breakpoints: {
        640: { slidesPerView: 3, spaceBetween: 16 },
        768: { slidesPerView: 4, spaceBetween: 18 },
        1024: { slidesPerView: 5, spaceBetween: 20 },
        1280: { slidesPerView: 6, spaceBetween: 24 }
      }
    });
  }
});
