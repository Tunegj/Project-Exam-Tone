import { loadUser, saveUser } from "../utils/user-helpers.js";
import { validateUserProfile } from "../utils/validators.js";
import { loadCart, saveCart } from "../utils/cart-helper.js";
import { money, finalPrice } from "../utils/price-helpers.js";
import { updateCartCount } from "../utils/cart-ui.js";

const dom = {
  form: document.querySelector("[data-checkout-form]"),

  firstName: document.querySelector("[data-checkout-first-name]"),
  lastName: document.querySelector("[data-checkout-last-name]"),
  email: document.querySelector("[data-checkout-email]"),
  phone: document.querySelector("[data-checkout-phone]"),
  address1: document.querySelector("[data-checkout-address1]"),
  address2: document.querySelector("[data-checkout-address2]"),
  postalCode: document.querySelector("[data-checkout-zip]"),
  city: document.querySelector("[data-checkout-city]"),
  country: document.querySelector("[data-checkout-country]"),

  notes: document.querySelector("#checkout-notes"),

  items: document.querySelector("[data-checkout-items]"),
  subtotal: document.querySelector("[data-checkout-subtotal]"),
  shipping: document.querySelector("[data-checkout-shipping]"),
  total: document.querySelector("[data-checkout-total]"),
};

let lastTotals = {
  subtotal: 0,
  shipping: 0,
  total: 0,
};

(function startCheckout() {
  if (!dom.form) return;

  const user = loadUser();
  const cart = loadCart() || [];

  prefillUser(user);

  renderCartSummary(cart);

  attachFormHandler(cart);
})();

function prefillUser(user) {
  if (!user) return;

  if (dom.firstName) dom.firstName.value = user.firstName ?? "";
  if (dom.lastName) dom.lastName.value = user.lastName ?? "";
  if (dom.email) dom.email.value = user.email ?? "";
  if (dom.phone) dom.phone.value = user.phone ?? "";
  if (dom.address1) dom.address1.value = user.address1 ?? "";
  if (dom.address2) dom.address2.value = user.address2 ?? "";
  if (dom.postalCode) dom.postalCode.value = user.postalCode ?? "";
  if (dom.city) dom.city.value = user.city ?? "";
  if (dom.country) dom.country.value = user.country ?? "";
}

function renderCartSummary(cart) {
  if (!dom.items || !dom.subtotal || !dom.shipping || !dom.total) return;

  if (!cart || cart.length === 0) {
    dom.items.innerHTML = `<li class="checkout-summary__empty">Your cart is empty</li>`;
    dom.subtotal.textContent = money(0);
    dom.shipping.textContent = money(0);
    dom.total.textContent = money(0);

    lastTotals = { subtotal: 0, shipping: 0, total: 0 };
    return;
  }

  let subtotal = 0;

  dom.items.innerHTML = cart
    .map((item) => {
      const product = item.product || item;
      const quantity = item.quantity ?? 1;

      const linePrice = finalPrice(product) * quantity;
      subtotal += linePrice;

      return `<li class="checkout-item">
            <span class="checkout-item__title">${product.title}</span>
            <span class="checkout-item__qty">${quantity}</span>
            <span class="checkout-item__price">${money(linePrice)}</span>
        </li>`;
    })
    .join("");

  const shipping = 0;
  const total = subtotal + shipping;

  dom.subtotal.textContent = money(subtotal);
  dom.shipping.textContent = money(shipping);
  dom.total.textContent = money(total);

  lastTotals = { subtotal, shipping, total };
}

function attachFormHandler(cart) {
  dom.form.addEventListener("submit", (event) => {
    event.preventDefault();

    const profile = {
      firstName: dom.firstName?.value.trim() || "",
      lastName: dom.lastName?.value.trim() || "",
      email: dom.email?.value.trim() || "",
      phone: dom.phone?.value.trim() || "",
      address1: dom.address1?.value.trim() || "",
      address2: dom.address2?.value.trim() || "",
      zip: dom.zip?.value.trim() || "",
      city: dom.city?.value.trim() || "",
      country: dom.country?.value.trim() || "",
    };

    const errors = validateUserProfile(profile);

    clearFieldErrors();

    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      showFieldErrors(errors);
      return;
    }

    saveUser(profile);

    const order = buildOrderObject(profile, cart);

    saveOrder(order);

    saveCart([]);
    updateCartCount([]);

    window.location.href = `/success.html?orderId=${encodeURIComponent(
      order.id
    )}`;
  });
}

function clearFieldErrors() {
  const errorEls = dom.form.querySelectorAll(".form-error");
  errorEls.forEach((el) => {
    el.textContent = "";
  });

  const invalidInputs = dom.form.querySelectorAll("[aria-invalid='true']");
  invalidInputs.forEach((input) => {
    input.removeAttribute("aria-invalid");
  });
}

/**
 * Show error messages under the fields that failed validation.
 * @param {Object} errors - keys like "firstName", "email", etc.
 */

function showFieldErrors(errors) {
  let firstInvalidElement = null;

  Object.entries(errors).forEach(([fieldName, message]) => {
    const errorElement = dom.form.querySelector(
      `[data-error-for="${fieldName}"]`
    );
    if (errorElement) {
      errorElement.textContent = message;
    }

    const inputElement = dom[fieldName];
    if (inputElement) {
      inputElement.setAttribute("aria-invalid", "true");

      if (!firstInvalidElement) {
        firstInvalidElement = inputElement;
      }
    }
  });

  if (firstInvalidElement) {
    firstInvalidElement.focus();
  }
}

function buildOrderObject(profile, cart) {
  const paymentMethodInput = dom.form.elements["payment-method"];
  let paymentMethodValue = "unknown";

  if (paymentMethodInput) {
    paymentMethodValue = paymentMethodInput.value || "unknown";
  }

  const cardNumberInput = dom.form.elements("#card-number");
  const cardNumber = (cardNumberInput?.value || "").replace(/\s+/g, "");
  const cardLast4 = cardNumber.slice(-4);

  const notes = dom.notes?.value.trim() || "";

  const orderId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now());

  return {
    id: orderId,
    createdAt: new Date().toISOString(),
    customer: profile,
    items: cart,
    payment: {
      method: paymentMethodValue,
      cardLast4,
    },
    notes,
    totals: {
      subtotal: lastTotals.subtotal,
      shipping: lastTotals.shipping,
      total: lastTotals.total,
    },
  };
}

function saveOrder(order) {
  const ORDERS_KEY = "mirae_orders";

  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    const existingOrders = raw ? JSON.parse(raw) : [];

    if (Array.isArray(existing)) {
      existing.push(order);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(existing));
    } else {
      localStorage.setItem(ORDERS_KEY, JSON.stringify([order]));
    }
  } catch (error) {
    console.error("Failed to save order:", error);
  }
}
