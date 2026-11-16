$(function() {
  const $form = $('#register-form');
  if (!$form.length) return;

  $form.on('submit', function(e) {
    e.preventDefault();
    $(this).trigger('register-submit');
  });

  $('[data-action="toggle-pwd"]').on('click', function(e) {
    e.preventDefault();
    const $input = $(this).siblings('input');
    const isPwd = $input.attr('type') === 'password';
    $input.attr('type', isPwd ? 'text' : 'password');
  });

  $('[data-action="goto-login"]').on('click', function(e) {
    e.preventDefault();
    $(this).trigger('auth-navigate', { target: 'login' });
  });
});
