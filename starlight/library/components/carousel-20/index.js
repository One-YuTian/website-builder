$(function() {
  if (typeof Swiper !== 'undefined') {
    if ($('.banner-swiper').length) {
      new Swiper('.banner-swiper', {
        loop: true,
        autoplay: { delay: 3000, disableOnInteraction: false },
        pagination: { el: '.banner-swiper .swiper-pagination', clickable: true }
      });
    }
    if ($('.mobile-banner-swiper').length) {
      new Swiper('.mobile-banner-swiper', {
        loop: true,
        autoplay: { delay: 3000, disableOnInteraction: false },
        pagination: { el: '.mobile-banner-swiper .swiper-pagination', clickable: true }
      });
    }
  }
});
