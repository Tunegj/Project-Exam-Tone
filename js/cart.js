import {
  loadCart,
  changeCartItemQuantity,
  removeCartItem,
  clearCart,
} from "../utils/cart-helper.js";
import { getProducts } from "./api/products.js";
import { cardHTML } from "../components/product-card.js";
import { updateCartCount } from "../utils/cart-ui.js";
import { finalPrice, money } from "../utils/price-helpers.js";

console.log("📦 cart page script is running");

const dom = {
  list: document.querySelector("[data-cart-list]"),
  empty: document.querySelector("[data-cart-empty]"),
  total: document.querySelector("[data-cart-total]"),
  clearBtn: document.querySelector("[data-cart-clear]"),
  recommendations: document.querySelector("[data-cart-recommendations]"),
};

console.log("🔧 Cart DOM hooks:", dom);

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

function updateTotal(cart) {
  const total = cart.reduce((sum, item) => {
    const unitPrice = finalPrice(item);
    return sum + unitPrice * item.quantity;
  }, 0);

  if (dom.total) {
    dom.total.textContent = money(total);
  }
}

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
    return;
  }

  dom.empty.hidden = true;

  dom.list.innerHTML = cart.map((item) => cartItemHTML(item)).join("");

  function renderRecommendations(cart, allProducts) {
    if (!dom.recommendations) return;

    const recs = getRecommendations(cart, allProducts);

    if (!recs.length) {
      dom.recommendations.innerHTML = "<p> No recommendations available</p>";
      return;
    }

    dom.recommendations.innerHTML = recs.map((p) => cardHTML(p)).join("");
  }

  updateTotal(cart);
  updateCartCount();

  if (window._allProducts) {
    renderRecommendations(cart, window._allProducts);
  }
}

function handleListClick(event) {
  const button = event.target.closest("[data-cart-action]");
  if (!button) return;

  const action = button.dataset.cartAction;

  const itemEl = button.closest("[data-cart-item-id]");
  if (!itemEl) return;

  const id = itemEl.dataset.cartItemId;

  if (action === "increase") {
    changeCartItemQuantity(id, 1);
  } else if (action === "decrease") {
    changeCartItemQuantity(id, -1);
  } else if (action === "remove") {
    removeCartItem(id);
  }

  renderCart();
}

function handleClearClick() {
  clearCart();
  renderCart();
}

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

startCartPage();
