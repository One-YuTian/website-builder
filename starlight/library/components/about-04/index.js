$(function() {
  $('#about-accordion button').on('click', function() {
    $(this).next().slideToggle(200);
  });
});