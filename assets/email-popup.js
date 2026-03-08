/**
 * Sakina Home — Email Popup
 * Exit-intent + timed trigger with cookie suppression.
 */

var EmailPopup = (function () {
  var popup = null;
  var form = null;
  var triggered = false;
  var COOKIE_DAYS = 30;

  function getCookie(name) {
    var value = '; ' + document.cookie;
    var parts = value.split('; ' + name + '=');
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  function setCookie(name, value, days) {
    var expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + value + '; expires=' + expires + '; path=/; SameSite=Lax';
  }

  function show() {
    if (triggered || !popup) return;
    triggered = true;
    popup.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    // Focus first focusable element
    var firstFocusable = popup.querySelector('input, button');
    if (firstFocusable) setTimeout(function () { firstFocusable.focus(); }, 50);
  }

  function dismiss(cookieName) {
    if (!popup) return;
    popup.setAttribute('hidden', '');
    document.body.style.overflow = '';
    setCookie(cookieName, '1', COOKIE_DAYS);
  }

  function handleFormSubmit(event, cookieName) {
    event.preventDefault();
    var emailInput = form.querySelector('[type="email"]');
    var errorEl = form.querySelector('.email-popup__error');
    var successEl = form.querySelector('.email-popup__success');
    var submitBtn = form.querySelector('.email-popup__submit');

    if (!emailInput.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
      errorEl.removeAttribute('hidden');
      successEl.setAttribute('hidden', '');
      emailInput.focus();
      return;
    }

    errorEl.setAttribute('hidden', '');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing…';

    var formData = new FormData(form);
    fetch('/contact', {
      method: 'POST',
      body: formData,
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
      .then(function () {
        successEl.removeAttribute('hidden');
        form.querySelector('.email-popup__field').style.display = 'none';
        setCookie(cookieName, '1', COOKIE_DAYS);
        setTimeout(function () { dismiss(cookieName); }, 3000);
      })
      .catch(function () {
        // On network error, still show success (form may have submitted) and dismiss
        successEl.removeAttribute('hidden');
        form.querySelector('.email-popup__field').style.display = 'none';
        setCookie(cookieName, '1', COOKIE_DAYS);
        setTimeout(function () { dismiss(cookieName); }, 3000);
      });
  }

  function init(cookieName, delayMs) {
    // Don't show on cart or checkout pages
    var path = window.location.pathname;
    if (path.indexOf('/cart') !== -1 || path.indexOf('/checkout') !== -1) return;

    // Don't show if already dismissed recently
    if (getCookie(cookieName)) return;

    popup = document.getElementById('email-popup');
    if (!popup) return;

    form = popup.querySelector('#email-popup-form');

    // Close triggers
    popup.querySelectorAll('[data-popup-close]').forEach(function (el) {
      el.addEventListener('click', function () { dismiss(cookieName); });
    });

    // Keyboard: Escape to close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !popup.hasAttribute('hidden')) {
        dismiss(cookieName);
      }
    });

    // Form submission
    if (form) {
      form.addEventListener('submit', function (e) { handleFormSubmit(e, cookieName); });
    }

    // Exit-intent: mouse leaves viewport via top edge
    document.addEventListener('mouseleave', function (e) {
      if (e.clientY <= 0) show();
    });

    // Timer fallback
    setTimeout(show, delayMs);
  }

  return { init: init };
})();
