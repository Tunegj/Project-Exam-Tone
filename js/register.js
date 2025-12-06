import { loadUser, saveUser } from "../utils/user-helpers.js";
import { validateUserProfile } from "../utils/validators.js";
import {
  setupFieldAccessibility,
  clearFieldErrors,
  applyFieldErrors,
} from "../utils/form-helpers.js";

/**
 * @typedef {Object} RegisterDomMap
 * @property {HTMLFormElement|null} form
 * @property {HTMLInputElement|null} firstName
 * @property {HTMLInputElement|null} lastName
 * @property {HTMLInputElement|null} email
 * @property {HTMLInputElement|null} phone
 * @property {HTMLInputElement|null} address1
 * @property {HTMLInputElement|null} address2
 * @property {HTMLInputElement|null} postalCode
 * @property {HTMLInputElement|null} city
 * @property {HTMLInputElement|null} country
 * @property {HTMLInputElement|null} password
 * @property {HTMLInputElement|null} confirmPassword
 * @property {HTMLElement|null} message
 */

/**
 * DOM references for inputs and gloval message element.
 * @type {RegisterDomMap}
 */
const dom = {
  form: document.querySelector("[data-register-form]"),
  firstName: document.querySelector("[data-register-first-name]"),
  lastName: document.querySelector("[data-register-last-name]"),
  email: document.querySelector("[data-register-email]"),
  phone: document.querySelector("[data-register-phone]"),
  address1: document.querySelector("[data-register-address1]"),
  address2: document.querySelector("[data-register-address2]"),
  postalCode: document.querySelector("[data-register-zip]"),
  city: document.querySelector("[data-register-city]"),
  country: document.querySelector("[data-register-country]"),
  password: document.querySelector("[data-register-password]"),
  confirmPassword: document.querySelector("[data-register-confirm-password]"),
  message: document.querySelector("[data-register-message]"),
};

/**
 * Show a global status message above/below the form.
 * @param {string} text - The message text to show.
 * @param {"info"|"error"|"success"} [type="info"] - Message type for styling.
 */
function showMessage(text, type = "info") {
  if (!dom.message) return;
  dom.message.textContent = text;
  dom.message.dataset.type = type;
}

/**
 * Build a plain profile object form the current form values.
 * @returns {Object} The user profile data from the form.
 */
function buildProfileFromForm() {
  return {
    firstName: dom.firstName.value.trim(),
    lastName: dom.lastName.value.trim(),
    email: dom.email.value.trim(),
    phone: dom.phone.value.trim(),
    address1: dom.address1.value.trim(),
    address2: dom.address2.value.trim(),
    postalCode: dom.postalCode.value.trim(),
    city: dom.city.value.trim(),
    country: dom.country.value.trim(),
  };
}

/**
 * If a user profile already exists, pre-fill the form with their data.
 */
function prefillIfUserExists() {
  const existing = loadUser();
  if (!existing) return;

  if (dom.firstName) dom.firstName.value = existing.firstName || "";
  if (dom.lastName) dom.lastName.value = existing.lastName || "";
  if (dom.email) dom.email.value = existing.email || "";
  if (dom.phone) dom.phone.value = existing.phone || "";
  if (dom.address1) dom.address1.value = existing.address1 || "";
  if (dom.address2) dom.address2.value = existing.address2 || "";
  if (dom.postalCode) dom.postalCode.value = existing.postalCode || "";
  if (dom.city) dom.city.value = existing.city || "";
  if (dom.country) dom.country.value = existing.country || "";
}

/**
 * Handle the register form submission:
 * validates profile + password, shows errors, and saves the user on success.
 * @param {SubmitEvent} event - The form submit event.
 */
function handleSubmit(event) {
  event.preventDefault();
  if (!dom.form) return;

  clearFieldErrors(dom.form);

  const profile = buildProfileFromForm();

  /** @type {Record<string, string>} */
  const errors = validateUserProfile(profile);

  const password = dom.password?.value || "";
  const confirmPassword = dom.confirmPassword?.value || "";

  // Password validation
  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  // Email domain validation
  if (
    profile.email &&
    !profile.email.toLowerCase().endsWith("@stud.noroff.no")
  ) {
    errors.email = "Email must be a valid stud.noroff.no address";
  }

  if (Object.keys(errors).length > 0) {
    const firstInvalid = applyFieldErrors(dom.form, errors);
    showMessage("Please fix the errors and try again", "error");
    if (firstInvalid && typeof firstInvalid.focus === "function") {
      firstInvalid.focus();
    }
    return;
  }

  const userToSave = {
    ...profile,
    password,
  };

  saveUser(userToSave);
  showMessage("Account created! Redirecting to login...", "success");

  setTimeout(() => {
    window.location.href = "../account/login.html";
  }, 2000);
}

function attachFieldListeners() {
  if (!dom.form) return;

  const inputs = dom.form.querySelectorAll("input, select, textarea");

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      clearFieldErrors(dom.form);
      if (dom.message && dom.message.dataset.type === "error") {
        showMessage("");
      }
    });
  });
}

/**
 * Initialize the register page:
 * pre-fills existing user data and sets up form submission handling.
 */
function startRegisterPage() {
  if (!dom.form) {
    console.warn("No [data-register-form] found on this page");
    return;
  }

  prefillIfUserExists();
  setupFieldAccessibility(dom.form);
  attachFieldListeners();
  dom.form.addEventListener("submit", handleSubmit);
}

startRegisterPage();
