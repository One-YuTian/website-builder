$(function() {
  if (typeof Swiper !== 'undefined') {
    if ($('.banner-swiper-12').length) {
      new Swiper('.banner-swiper-12', {
        loop: true,
        autoplay: {
          delay: 3000,
          disableOnInteraction: false
        },
        effect: 'fade',
        fadeEffect: {
          crossFade: true
        },
        pagination: {
          el: '.banner-swiper-12 .swiper-pagination',
          clickable: true
        }
      });
    }
  }
});
