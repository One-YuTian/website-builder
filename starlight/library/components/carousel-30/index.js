$(function() {
  if (typeof Swiper !== 'undefined' && $('.banner-swiper').length) {
    new Swiper('.banner-swiper', {
      loop: true,
      autoplay: { delay: 4000, disableOnInteraction: false },
      pagination: { el: '.banner-swiper .swiper-pagination', clickable: true },
      navigation: { nextEl: '.banner-swiper .swiper-button-next', prevEl: '.banner-swiper .swiper-button-prev' }
    });
  }
});
