$(function() {
  const $form = $('#login-form');
  if (!$form.length) return;

  $form.on('submit', function(e) {
    e.preventDefault();
    $(this).trigger('login-submit');
  });

  $('[data-action="toggle-pwd"]').on('click', function(e) {
    e.preventDefault();
    const $input = $(this).siblings('input');
    const isPwd = $input.attr('type') === 'password';
    $input.attr('type', isPwd ? 'text' : 'password');
  });

  $('[data-action="goto-register"]').on('click', function(e) {
    e.preventDefault();
    $(this).trigger('auth-navigate', { target: 'register' });
  });

  $('[data-action="forgot-pwd"]').on('click', function(e) {
    e.preventDefault();
    $(this).trigger('auth-navigate', { target: 'forgot-password' });
  });
});
