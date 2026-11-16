$(function() {
  $('section').on('click', '[role="button"]', function(e) {
    e.preventDefault();
    $(this).trigger('promotion-navigate');
  });
});
