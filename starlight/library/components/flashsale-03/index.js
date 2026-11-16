$(function() {
  if (typeof Swiper !== 'undefined' && $('.super-deals-swiper-03').length) {
    new Swiper('.super-deals-swiper-03', {
      slidesPerView: 2,
      spaceBetween: 12,
      watchOverflow: true,
      navigation: {
        nextEl: '.super-deals-next-03',
        prevEl: '.super-deals-prev-03'
      },
      breakpoints: {
        640: { slidesPerView: 2, spaceBetween: 16 },
        768: { slidesPerView: 3, spaceBetween: 20 },
        1024: { slidesPerView: 3, spaceBetween: 24 }
      }
    });
  }
});
