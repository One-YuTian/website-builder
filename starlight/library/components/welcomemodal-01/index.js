$(function() {
  $('[data-region="modal-card"]').on('click', '[data-action]', function(e) {
    e.preventDefault();
    const action = $(this).data('action');
    $(this).trigger('welcomemodal-action', { action });
  });
});
