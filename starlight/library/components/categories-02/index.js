$(function() {
  if (typeof Swiper !== 'undefined' && $('.categories-swiper-02').length) {
    new Swiper('.categories-swiper-02', {
      slidesPerView: 'auto',
      spaceBetween: 12,
      freeMode: true
    });
  }
});
