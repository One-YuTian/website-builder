$(function() {
  if (typeof Swiper !== 'undefined' && $('.benefits-swiper-04').length) {
    new Swiper('.benefits-swiper-04', {
      slidesPerView: 'auto',
      spaceBetween: 16,
      freeMode: true
    });
  }
});
