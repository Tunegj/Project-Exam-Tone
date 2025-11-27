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

  billingSameAsDelivery: document.querySelector("#billing-same-as-delivery"),
  billingName: document.querySelector("[name=billingName]"),
  billingStreet: document.querySelector("[name=billingStreet]"),
  billingPO: document.querySelector("[name=billingPO]"),
  billingCountry: document.querySelector("[name=billingCountry]"),

  notes: document.querySelector("#checkout-notes"),

  items: document.querySelector("[data-checkout-items]"),
  subtotal: document.querySelector("[data-checkout-subtotal]"),
  shipping: document.querySelector("[data-checkout-shipping]"),
  total: document.querySelector("[data-checkout-total]"),

  status: document.querySelector("[data-checkout-status]"),
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

  attachFieldListeners();

  attachFormHandler(cart);

  setUpBillingSync();
})();

// Set a status message in the checkout form
function setStatus(message, tone = "neutral") {
  if (!dom.status) return;
  dom.status.textContent = message || "";
  dom.status.dataset.tone = tone || "neutral";
}

// Prefill the checkout form with user data if available
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

// Render the cart summary in the checkout page
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

function setUpBillingSync() {
  if (!dom.billingSameAsDelivery) return;

  const fields = [
    dom.billingName,
    dom.billingStreet,
    dom.billingPO,
    dom.billingCountry,
  ];

  const syncAndToggle = () => {
    const isSame = dom.billingSameAsDelivery.checked;

    if (isSame) {
      if (dom.billingName) {
        const fullName = `${dom.firstName.value || ""}  ${
          dom.lastName.value || ""
        }`.trim();
        dom.billingName.value = fullName;
      }

      if (dom.billingStreet && dom.address1) {
        dom.billingStreet.value = dom.address1.value;
      }
      if (dom.billingPO && dom.postalCode) {
        dom.billingPO.value = dom.postalCode.value;
      }

      if (dom.billingCountry && dom.country) {
        dom.billingCountry.value = dom.country.value;
      }

      fields.forEach((field) => {
        if (!field) return;
        field.setAttribute("disabled", "disabled");
      });
    } else {
      fields.forEach((field) => {
        if (!field) return;
        field.removeAttribute("disabled");
      });
    }
  };

  syncAndToggle();

  dom.billingSameAsDelivery.addEventListener("change", syncAndToggle);
}

function attachFieldListeners() {
  if (!dom.form) return;

  const inputs = dom.form.querySelectorAll("input, textarea");

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      const name = input.name;
      if (!name) return;

      const errorEl = dom.form.querySelector(`[data-error-for="${name}"]`);

      if (errorEl) {
        errorEl.textContent = "";
      }

      input.removeAttribute("aria-invalid");

      if (dom.status && dom.status.dataset.tone === "error") {
        setStatus("");
      }
    });
  });
}

// Handle the checkout form submission
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
      postalCode: dom.postalCode?.value.trim() || "",
      city: dom.city?.value.trim() || "",
      country: dom.country?.value.trim() || "",
    };

    const errors = validateUserProfile(profile);
    console.log("Validation errors:", errors);

    clearFieldErrors();

    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      showFieldErrors(errors);
      setStatus("Please fix the highlighted fields and try again.", "error");
      return;
    }

    if (!cart || cart.length === 0) {
      setStatus(
        "Your cart is empty. Please add items before checking out.",
        "error"
      );
      return;
    }

    saveUser(profile);

    const order = buildOrderObject(profile, cart);

    try {
      saveOrder(order);
    } catch (error) {
      console.error("Error saving order:", error);
      setStatus(
        "There was an error processing your order. Please try again.",
        "error"
      );
      return;
    }

    saveCart([]);
    updateCartCount([]);
    setStatus("Order placed successfully!", "success");

    window.location.href = `success.html?orderId=${encodeURIComponent(
      order.id
    )}`;
  });
}

// Clear all field error messages and invalid states
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
  const paymentMethodInput = dom.form.elements["paymentMethod"];
  let paymentMethodValue = "unknown";

  if (paymentMethodInput) {
    paymentMethodValue = paymentMethodInput.value || "unknown";
  }

  const cardNumberInput = dom.form.elements["cardNumber"];
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

// Save the order to localStorage
function saveOrder(order) {
  const ORDERS_KEY = "mirae_orders";
  const raw = localStorage.getItem(ORDERS_KEY);

  let existingOrders = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        existingOrders = parsed;
      }
    } catch (error) {
      console.error("Failed to parse existing orders:", error);
      existingOrders = [];
    }
  }

  existingOrders.push(order);

  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(existingOrders));
  } catch (error) {
    throw error;
  }
}
