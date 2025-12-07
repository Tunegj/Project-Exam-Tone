import { money, finalPrice } from "../utils/price-helpers.js";
import { logout } from "../utils/auth.js";
import { clearCart } from "../utils/cart-helper.js";
import { clearUser } from "../utils/user-helpers.js";
import { updateCartCount } from "../utils/cart-ui.js";
/**
 * Local storage key where orders are saved.
 * @type {string}
 */
const ORDERS_KEY = "mirae_orders";

/**
 * DOM references used in the success page
 * @typedef {Object} OrderCustomer
 * @property {string} [firstName] - Customer's first name.
 * @property {string} [email] - Customer's email address.
 */

/**  @typedef {Object} OrderPayment
 * @property {string} [method] - Payment method used.
 * @property {string} [cardLast4] - Last 4 digits of the card used.
 */

/**  @typedef {Object} OrderTotals
 * @property {number} [subtotal] - Subtotal amount before shipping.
 * @property {number} [shipping] - Shipping cost.
 * @property {number} [total] - Total amount.
 */

/**
 * @typedef {Object} OrderItem
 * @property {String} [title] - Product title.
 * @property {number} [price] - Base price of the product.
 * @property {number} [discountedPrice] - Discounted price, if any.
 * @property {number} [quantity] - Quantity ordered.
 */

/**
 * @typedef {Object} Order
 * @property {string} id - Unique order ID.
 * @property {string} [createdAt] -ISO timestamp of when the order was created.
 * @property {OrderCustomer} [customer] - Customer information.
 * @property {OrderPayment} [payment] - Payment information.
 * @property {OrderTotals} [totals] - Order totals.
 * @property {Array<OrderItem>} [items] - List of ordered items.
 */

/**
 * typedef {Object} SuccessDomMap
 * @property {HTMLElement||null} status - Element showing the order status message.
 * @property {HTMLElement||null} customerName - Element showing the customer's name.
 * @property {NodeListOf<HTMLElement>} customerEmail - Elements showing the customer's email.
 * @property {HTMLElement||null} orderId - Element showing the order ID.
 * @property {HTMLElement||null} orderDate - Element showing the order date.
 * @property {HTMLElement||null} orderPayment - Element showing the payment method.
 * @property {HTMLElement||null} itemsList - Element containing the list of ordered items.
 * @property {HTMLElement||null} subtotal - Element showing the subtotal amount.
 * @property {HTMLElement||null} shipping - Element showing the shipping cost.
 * @property {HTMLElement||null} total - Element showing the total amount.
 * @property {HTMLElement||null} logOutBtn - Logout button element.
 */

/**
 * DOM references used in the success page
 * @type {SuccessDomMap}
 */
const dom = {
  status: document.querySelector("[data-success-status]"),
  customerName: document.querySelector("[data-customer-name]"),
  customerEmail: document.querySelectorAll("[data-customer-email]"),
  orderId: document.querySelector("[data-order-id]"),
  orderDate: document.querySelector("[data-order-date]"),
  orderPayment: document.querySelector("[data-order-payment]"),

  itemsList: document.querySelector("[data-success-list]"),
  subtotal: document.querySelector("[data-success-subtotal]"),
  shipping: document.querySelector("[data-success-shipping]"),
  total: document.querySelector("[data-success-total]"),

  logOutBtn: document.querySelector(".btn-logout"),
};

/**
 * Main entry point for the success page.
 *
 * Reads the order ID from the URL, loads the order from localStorage,
 * and renders the order details or an error message.
 *
 * Immediately invoked when the script loads.
 */
(function startSuccessPage() {
  const orderId = getOrderIdFromUrl();

  if (!orderId) {
    renderError("We could not find an order ID in the URL. Please try again.");
    setupLogout();
    return;
  }

  const order = loadOrder(orderId);

  if (!order) {
    renderError(
      "We could not find this order. It may have expired or been removed."
    );
    setupLogout();
    return;
  }

  renderOrder(order);
  setupLogout();
})();

/**
 * Extract the order ID from the current page URL.
 * @returns {string|null} The order ID, or null if not found.
 */
function getOrderIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("orderId");
  return id ? id.trim() : null;
}

/**
 * Look up a single order by ID from localStorage.
 * @param {string} id - The order ID to look for.
 * @returns {Object|null} The matching order object, or null if not found.
 */
function loadOrder(id) {
  const raw = localStorage.getItem(ORDERS_KEY);
  if (!raw) return null;

  try {
    const orders = JSON.parse(raw);
    if (!Array.isArray(orders)) return null;
    return orders.find((order) => order.id === id) || null;
  } catch (error) {
    console.error("Failed to parse orders", error);
    return null;
  }
}

/**
 * Render an error state when the order cannot be loaded.
 * Falls back to generic placeholder values for all UI fields.
 * @param {string} message - The error message to display.
 */
function renderError(message) {
  document.title = "Order Not Found || MIRAE";

  if (dom.status) {
    dom.status.textContent = message;
  }

  if (dom.customerName) {
    dom.customerName.textContent = "friend";
  }

  dom.customerEmail.forEach((el) => {
    el.textContent = "your email";
  });

  if (dom.orderId) dom.orderId.textContent = "—";
  if (dom.orderDate) dom.orderDate.textContent = "—";
  if (dom.orderPayment) dom.orderPayment.textContent = "—";

  if (dom.itemsList) {
    dom.itemsList.innerHTML =
      '<li class="success-item success-item--empty">No order details available.</li>';
  }

  if (dom.subtotal) dom.subtotal.textContent = money(0);
  if (dom.shipping) dom.shipping.textContent = money(0);
  if (dom.total) dom.total.textContent = money(0);
}

/**
 * Render the full order details into the success page:
 * customer info, order info, item list, and totals.
 * @param {Object} order - The order object loaded from storage.
 */
function renderOrder(order) {
  const { customer, payment, totals, items, createdAt, id } = order;

  document.title = "Order Confirmed || MIRAE";

  if (dom.customerName) {
    const first = customer?.firstName || "";
    dom.customerName.textContent = first || "friend";
  }

  dom.customerEmail.forEach((el) => {
    el.textContent = customer?.email || "your email";
  });

  if (dom.orderId) {
    dom.orderId.textContent = id;
  }

  if (dom.orderDate) {
    const date = createdAt ? new Date(createdAt) : new Date();
    dom.orderDate.textContent = date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (dom.orderPayment) {
    const method = payment?.method || "Card";
    const last4 = payment?.cardLast4;
    dom.orderPayment.textContent = last4
      ? `${formatPaymentMethod(method)} •••• ${last4}`
      : formatPaymentMethod(method);
  }

  if (dom.itemsList) {
    if (!items || items.length === 0) {
      dom.itemsList.innerHTML = `<li class ="success-item success-item--empty">No items found in this order.</li>`;
    } else {
      const html = items
        .map((item) => {
          const product = item.product || item;
          const quantity = item.quantity ?? 1;
          const linePrice = finalPrice(product) * quantity;

          return `<li class="success-item">
                <span class="success-item__title">${product.title} </span>
                <span class="success-item__quantity"> x${quantity}</span>
                <span class="success-item__price">${money(linePrice)}</span>
                </li>`;
        })
        .join("");

      dom.itemsList.innerHTML = html;
    }
  }

  if (totals) {
    if (dom.subtotal) dom.subtotal.textContent = money(totals.subtotal || 0);
    if (dom.shipping) dom.shipping.textContent = money(totals.shipping || 0);
    if (dom.total) dom.total.textContent = money(totals.total || 0);
  }

  if (dom.status) {
    dom.status.textContent = `Your order is confirmed! A receipt has been sent to ${
      customer?.email || "your email"
    }.`;
  }
}

/**
 * Return a human-readable payment method label based on its internal value.
 * @param {string} method - The stored payment method identifier.
 * @returns {string} - A formatted payment method label.
 */
function formatPaymentMethod(method) {
  switch (method) {
    case "visa-mastercard":
      return "Visa/Mastercard";
    case "american-express":
      return "American Express";
    case "gift-card":
      return "Gift Card";
    default:
      return "Card";
  }
}

/**
 * Wire up the logout button to clear the stored user
 * and send the user back to the homepage.
 */
function setupLogout() {
  if (!dom.logOutBtn) return;

  dom.logOutBtn.addEventListener("click", () => {
    clearAuth();
    clearUser();
    clearCart();
    updateCartCount();
    window.location.href = "./account/login.html";
  });
}
