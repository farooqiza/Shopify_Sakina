/**
 * Sakina Home — Wishlist
 * localStorage-based wishlist. No app required.
 * Products stored as: [{ id, handle, title, image, price, url }]
 */

(function () {
  var STORAGE_KEY = 'sakina_wishlist';

  /* ─── Storage helpers ─── */
  function getItems() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (_) {
      return [];
    }
  }

  function saveItems(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (_) {}
  }

  function isWishlisted(productId) {
    return getItems().some(function (i) { return String(i.id) === String(productId); });
  }

  function addItem(product) {
    var items = getItems();
    if (!items.some(function (i) { return String(i.id) === String(product.id); })) {
      items.push(product);
      saveItems(items);
    }
  }

  function removeItem(productId) {
    var items = getItems().filter(function (i) { return String(i.id) !== String(productId); });
    saveItems(items);
  }

  function toggleItem(product) {
    if (isWishlisted(product.id)) {
      removeItem(product.id);
      return false;
    } else {
      addItem(product);
      return true;
    }
  }

  /* ─── Button sync ─── */
  function syncButton(btn) {
    var id = btn.dataset.productId;
    var wishlisted = isWishlisted(id);
    btn.setAttribute('aria-pressed', wishlisted ? 'true' : 'false');
    btn.setAttribute(
      'aria-label',
      wishlisted
        ? 'Remove ' + (btn.dataset.productTitle || 'product') + ' from wishlist'
        : 'Add ' + (btn.dataset.productTitle || 'product') + ' to wishlist'
    );
    var label = btn.querySelector('.wishlist-btn__label');
    if (label) label.textContent = wishlisted ? 'Saved' : '';
  }

  function syncAllButtons() {
    document.querySelectorAll('[data-wishlist-btn]').forEach(syncButton);
  }

  function handleButtonClick(btn) {
    var product = {
      id: btn.dataset.productId,
      handle: btn.dataset.productHandle,
      title: btn.dataset.productTitle,
      image: btn.dataset.productImage,
      price: btn.dataset.productPrice,
      url: btn.dataset.productUrl
    };
    toggleItem(product);
    syncButton(btn);
    // Pop animation
    btn.classList.remove('wishlist-btn--animating');
    void btn.offsetWidth; // reflow
    btn.classList.add('wishlist-btn--animating');
    btn.addEventListener('animationend', function () {
      btn.classList.remove('wishlist-btn--animating');
    }, { once: true });
    // Dispatch event for any listeners
    document.dispatchEvent(new CustomEvent('wishlist:change', {
      detail: { productId: product.id, wishlisted: isWishlisted(product.id), items: getItems() }
    }));
  }

  /* ─── Wishlist page rendering ─── */
  function renderWishlistPage() {
    var container = document.getElementById('wishlist-page-grid');
    if (!container) return;

    var items = getItems();
    if (items.length === 0) {
      container.innerHTML = '<p class="wishlist-empty">Your wishlist is empty. <a href="/collections/all">Browse products</a></p>';
      return;
    }

    container.innerHTML = items.map(function (item) {
      return '<div class="wishlist-card">' +
        '<a href="' + item.url + '" class="wishlist-card__image-link">' +
        (item.image
          ? '<img src="' + item.image + '" alt="' + (item.title || '') + '" loading="lazy" class="wishlist-card__image">'
          : '<div class="wishlist-card__image-placeholder"></div>') +
        '</a>' +
        '<div class="wishlist-card__info">' +
        '<a href="' + item.url + '" class="wishlist-card__title">' + (item.title || '') + '</a>' +
        '<p class="wishlist-card__price">' + (item.price || '') + '</p>' +
        '<div class="wishlist-card__actions">' +
        '<a href="' + item.url + '" class="wishlist-card__view button">View Product</a>' +
        '<button type="button" class="wishlist-card__remove" data-remove-id="' + item.id + '" aria-label="Remove from wishlist">Remove</button>' +
        '</div>' +
        '</div>' +
        '</div>';
    }).join('');

    container.querySelectorAll('[data-remove-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeItem(btn.dataset.removeId);
        renderWishlistPage();
        document.dispatchEvent(new CustomEvent('wishlist:change', { detail: { items: getItems() } }));
      });
    });
  }

  /* ─── Count badge ─── */
  function updateCountBadge() {
    var count = getItems().length;
    document.querySelectorAll('[data-wishlist-count]').forEach(function (el) {
      el.textContent = count;
      el.style.display = count > 0 ? '' : 'none';
    });
  }

  /* ─── Init ─── */
  function init() {
    // Delegate click on wishlist buttons
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-wishlist-btn]');
      if (btn) handleButtonClick(btn);
    });

    // Sync state on load and storage changes (multi-tab)
    syncAllButtons();
    updateCountBadge();
    renderWishlistPage();

    window.addEventListener('storage', function (e) {
      if (e.key === STORAGE_KEY) {
        syncAllButtons();
        updateCountBadge();
        renderWishlistPage();
      }
    });

    document.addEventListener('wishlist:change', function () {
      updateCountBadge();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose public API
  window.SakinaWishlist = { getItems: getItems, isWishlisted: isWishlisted };
})();
