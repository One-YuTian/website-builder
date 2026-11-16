$(function() {
  $('#contact-message-form').on('submit', function(e) {
    e.preventDefault();
    const firstName = $('#first-name').val();
    const lastName = $('#last-name').val();
    const email = $('#email').val();
    const message = $('#message').val();

    const event = new CustomEvent('contact-submit', {
      bubbles: true,
      composed: true,
      detail: { firstName, lastName, email, message }
    });
    this.dispatchEvent(event);

    $(this).find('input, textarea').val('');
  });
});