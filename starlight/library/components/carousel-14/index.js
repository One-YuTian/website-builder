$(function() {
  if (typeof Swiper !== 'undefined') {
    if ($('.banner-swiper-14').length) {
      new Swiper('.banner-swiper-14', {
        loop: true,
        autoplay: {
          delay: 3500,
          disableOnInteraction: false
        },
        pagination: {
          el: '.banner-swiper-14 .swiper-pagination',
          clickable: true
        }
      });
    }

    if ($('.mobile-banner-swiper-14').length) {
      new Swiper('.mobile-banner-swiper-14', {
        loop: true,
        autoplay: {
          delay: 3500,
          disableOnInteraction: false
        },
        pagination: {
          el: '.mobile-banner-swiper-14 .swiper-pagination',
          clickable: true
        }
      });
    }
  }
});
