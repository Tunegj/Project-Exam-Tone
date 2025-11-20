import { getCartCount } from "./cart.js";

export function updateCartCount() {
  const cartCountEl = document.querySelector("[data-cart-count]");

  if (!cartCountEl) return;

  const count = getCartCount();
  cartCountEl.textContent = count;
}
