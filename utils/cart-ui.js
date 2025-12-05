import { getCartCount } from "./cart-helper.js";

/**
 * Update all elements showing the cart count.
 * Any element with the attribute `data-cart-count` will be updated.
 * If data-hide-when-empty is present and the cart is empty, the element will be hidden.
 */
export function updateCartCount() {
  const cartCountEls = document.querySelector("[data-cart-count]");
  if (!cartCountEls.length) return;

  const count = getCartCount();

  cartCountEls.forEach((el) => {
    el.textContent = count;

    if (el.dataset.hideWhenEmpty === "true") {
      el.hidden = count === 0;
    }
  });
}
