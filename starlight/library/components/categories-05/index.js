$(function() {
  if (typeof Swiper !== 'undefined' && $('.categories-swiper-05').length) {
    new Swiper('.categories-swiper-05', {
      slidesPerView: 1.8,
      spaceBetween: 14,
      breakpoints: {
        640: { slidesPerView: 2.5, spaceBetween: 18 },
        768: { slidesPerView: 3.2, spaceBetween: 20 },
        1024: { slidesPerView: 4, spaceBetween: 24 }
      }
    });
  }
});
