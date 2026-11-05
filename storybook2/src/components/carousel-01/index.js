$(function() {
  if (typeof Swiper !== 'undefined') {
    if ($('.banner-swiper').length) {
      new Swiper('.banner-swiper', {
        loop: true,
        autoplay: {
          delay: 2500,
          disableOnInteraction: false
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true
        }
      });
    }

    if ($('.mobile-banner-swiper').length) {
      new Swiper('.mobile-banner-swiper', {
        loop: true,
        autoplay: {
          delay: 3000,
          disableOnInteraction: false
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true
        }
      });
    }
  }
});