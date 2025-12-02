import {
  loadCart,
  changeCartItemQuantity,
  removeCartItem,
  clearCart,
} from "../utils/cart-helper.js";
import { getProducts } from "../api/products.js";
import { cardHTML } from "../components/product-card.js";
import { updateCartCount } from "../utils/cart-ui.js";
import { finalPrice, money } from "../utils/price-helpers.js";

/**
 * typedef {Object} CartProductImage
 * @property {string} [url] - Image URL.
 * @property {string} [alt] - Image alt text.
 */

/** * typedef {Object} CartProduct
 * @property {string} id - Product ID.
 * @property {string} title - Product title.
 * @property {number} price - Base price of the product.
 * @property {number} [discountedPrice] - Discounted price, if any.
 * @property {CartProductImage} [image] - Product image.
 * @property {Array<string>} [tags] - Tags associated with the product.
 */

/**
 * typedef {CartProduct & {quantity: number}} CartItem
 */

/**
 * typedef {Object} CartDomMap
 * @property {HTMLElement||null} list - Element containing the list of cart items.
 * @property {HTMLElement||null} empty - Element shown when the cart is empty.
 * @property {HTMLElement||null} total - Element showing the cart total amount.
 * @property {HTMLElement||null} clearBtn - Button to clear the cart.
 * @property {HTMLElement||null} recommendations - Element containing product recommendations.
 * @property {HTMLElement||null} message - Element for showing cart messages.
 * @property {HTMLElement||null} summary - Cart summary section.
 */

/**
 * @type {CartDomMap}
 */

const dom = {
  list: document.querySelector("[data-cart-list]"),
  empty: document.querySelector("[data-cart-empty]"),
  total: document.querySelector("[data-cart-total]"),
  clearBtn: document.querySelector("[data-cart-clear]"),
  recommendations: document.querySelector("[data-cart-recommendations]"),
  message: document.querySelector("[data-cart-message]"),
  summary: document.querySelector(".cart-summary"),
};

/**
 * Generate the HTML string for a single cart item row.
 *
 * @param {CartItem} item - The cart item to render.
 * @returns {string} - HTML string for the cart item.
 */
function cartItemHTML(item) {
  const unitPrice = finalPrice(item);
  const lineTotal = unitPrice * item.quantity;

  const imageUrl =
    item.image?.url || "https://via.placeholder.com/120?text=No+image";
  const imageAlt = item.image?.alt || item.title || "Product image";

  return `
    <article class="cart-item" data-cart-item-id="${item.id}">
      <div class="cart-item__image">
        <img src="${imageUrl}" alt="${imageAlt}">
      </div>

      <div class="cart-item__info">
        <h2 class="cart-item__title">${item.title}</h2>
        <p class="cart-item__unit-price">${money(unitPrice)} each</p>
      </div>

      <div class="cart-item__quantity">
        <button
          type="button"
          class="cart-item__qty-btn"
          data-cart-action="decrease"
        >
          –
        </button>

        <span class="cart-item__qty-value">${item.quantity}</span>

        <button
          type="button"
          class="cart-item__qty-btn"
          data-cart-action="increase"
        >
          +
        </button>
      </div>

      <p class="cart-item__subtotal">
        ${money(lineTotal)}
      </p>

      <button
        type="button"
        class="cart-item__remove"
        data-cart-action="remove"
        aria-label="Remove ${item.title} from cart"
      >
        ×
      </button>
    </article>
  `;
}

/**
 * Set a temporary feedback message for cart actions.
 *
 * Clears itself after a short delay if the message hasn't changed.
 *
 * @param {string} text - The message text to show. Empty string clears immediately.
 * @returns {void}
 */
function setCartMessage(text) {
  if (!dom.message) return;
  dom.message.textContent = text || "";

  if (text) {
    setTimeout(() => {
      if (dom.message.textContent === text) {
        dom.message.textContent = "";
      }
    }, 3000);
  }
}

/**
 * Calculate product recommendations based on shared tags
 * between items in the cart and the full product list.
 *
 * @param {CartItem[]} cart - The current cart items.
 * @param {CartProduct[]} allProducts - The full list of products.
 * @param {number} [max=4] - Maximum number of recommendations to return.
 * @returns {CartProduct[]} - Array of recommended products.
 */
function getRecommendations(cart, allProducts, max = 4) {
  if (!Array.isArray(cart) || cart.length === 0) return [];
  if (!Array.isArray(allProducts) || allProducts.length === 0) return [];

  const cartTags = new Set();

  cart.forEach((item) => {
    const fullProduct = allProducts.find((p) => p.id === item.id);
    if (fullProduct && Array.isArray(fullProduct.tags)) {
      fullProduct.tags.forEach((t) => cartTags.add(t));
    }
  });

  if (cartTags.size === 0) return [];

  const matches = allProducts
    .filter((p) => {
      // don’t recommend items already in the cart
      if (cart.some((item) => item.id === p.id)) return false;
      if (!Array.isArray(p.tags)) return false;

      return p.tags.some((tag) => cartTags.has(tag));
    })
    .slice(0, max);

  return matches;
}

/**
 * Render the recommendation section using the current cart
 * and the globally cached product list.
 *
 * @param {CartItem[]} cart - The current cart items.
 * @param {CartProduct[]} allProducts - The full list of products.
 * @returns {void}
 */
function renderRecommendations(cart, allProducts) {
  if (!dom.recommendations) return;

  const recs = getRecommendations(cart, allProducts);

  if (!recs.length) {
    dom.recommendations.innerHTML = "<p> No recommendations available</p>";
    return;
  }

  dom.recommendations.innerHTML = recs.map((p) => cardHTML(p)).join("");
}

/**
 * Update the cart total element based on the current cart contents.
 *
 * @param {CartItem[]} cart - The current cart items.
 * @returns {void}
 */
function updateTotal(cart) {
  const total = cart.reduce((sum, item) => {
    const unitPrice = finalPrice(item);
    return sum + unitPrice * item.quantity;
  }, 0);

  if (dom.total) {
    dom.total.textContent = money(total);
  }
}

/**
 * Render the full cart view:
 * - Empty state
 * - List of items
 * - Summary totals
 * - Recommendations (if products are loaded)
 *
 * @returns {void}
 */
function renderCart() {
  const cart = loadCart();
  console.log("🔎 Cart on cart page:", cart);

  // if (!dom.list || !dom.empty) {
  //   console.warn("❗ Cart DOM elements missing", dom.list, dom.empty);
  //   return;
  // }

  if (cart.length === 0) {
    dom.list.innerHTML = "";
    dom.empty.hidden = false;
    updateTotal(cart);
    updateCartCount();
    setCartMessage("Your cart is empty.");
    return;
  }

  if (dom.empty) dom.empty.hidden = true;
  if (dom.summary) dom.summary.classList.remove("cart-summary--disabled");
  if (dom.clearBtn) dom.clearBtn.disabled = false;

  if (dom.list) {
    dom.list.innerHTML = cart.map((item) => cartItemHTML(item)).join("");
  }

  updateTotal(cart);
  updateCartCount();

  if (window._allProducts) {
    renderRecommendations(cart, window._allProducts);
  }
}

/**
 * Handle all click eventes inside the cart list:
 * - Increase quantity
 * - Decrease quantity
 * - Remove item
 *
 * Uses the event delegation on the list container.
 *
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
function handleListClick(event) {
  const button = event.target.closest("[data-cart-action]");
  if (!button) return;

  const action = button.dataset.cartAction;
  const itemEl = button.closest("[data-cart-item-id]");
  if (!itemEl) return;

  const id = itemEl.dataset.cartItemId;
  const cartBefore = loadCart();
  const item = cartBefore.find((entry) => entry.id === id);

  if (action === "increase") {
    changeCartItemQuantity(id, 1);
    setCartMessage(`Increased quantity of ${item.title}.`);
  } else if (action === "decrease") {
    changeCartItemQuantity(id, -1);
    setCartMessage(`Updated quantity of ${item.title}.`);
  } else if (action === "remove") {
    removeCartItem(id);
    setCartMessage(`Removed ${item.title} from cart.`);
  }

  renderCart();
}

/**
 * Clear the entire cart and re-render the view.
 * @returns {void}
 */
function handleClearClick() {
  clearCart();
  renderCart();
}

/**
 * Main entry point for the cart page.
 *
 * - Wires up event listeners.
 * - Loads products for recommendations.
 * - Renders the initial cart view.
 *
 * @returns {Promise<void>}
 */
async function startCartPage() {
  if (dom.list) {
    dom.list.addEventListener("click", handleListClick);
  }

  if (dom.clearBtn) {
    dom.clearBtn.addEventListener("click", handleClearClick);
  }

  try {
    window._allProducts = await getProducts();
  } catch (err) {
    console.error("error loading products:", err);
    window._allProducts = [];
  }

  renderCart();
}

// Immediately bootstrap the cart page on script load.
startCartPage();
