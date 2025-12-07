import { loadUser } from "../utils/user-helpers.js";
import { isEmail } from "../utils/validators.js";
import { saveAuthToken } from "../utils/auth.js";
import {
  setupFieldAccessibility,
  clearFieldErrors,
  applyFieldErrors,
} from "../utils/form-helpers.js";

/**
 * @typedef {Object} LoginDomMap
 * @property {HTMLFormElement|null} form
 * @property {HTMLInputElement|null} email
 * @property {HTMLInputElement|null} password
 * @property {HTMLElement|null} emailError
 * @property {HTMLElement|null} passwordError
 * @property {HTMLElement|null} message
 */

/**
 * DOM references used in the login page
 * @type {LoginDomMap}
 */
const dom = {
  form: document.querySelector("[data-login-form]"),
  email: document.querySelector("[data-login-email]"),
  password: document.querySelector("[data-login-password]"),
  message: document.querySelector("[data-login-message]"),
};

/**
 * Set the global login message shown above/below the form.
 * Used for success, error and neutral info messages.
 * @param {string} text - The message text to show.
 * @param {"info"|"error"|"success"} [type="info"] - Message type for styling.
 */
function setMessage(text, type = "info") {
  if (!dom.message) return;
  dom.message.textContent = text || "";
  dom.message.dataset.type = type;
}

/**
 * Handle the login form submission.
 * Validates input, checks stored user data, and redirects on success.
 *
 * @param {SubmitEvent} event - The form submission event.
 */
function handleSubmit(event) {
  event.preventDefault();

  clearFieldErrors(dom.form);
  setMessage("");

  const email = dom.email?.value.trim().toLowerCase() || "";
  const password = dom.password?.value || "";

  /** @type {Record<string, string>} */
  const errors = {};

  // Email validation
  if (!email) {
    errors.email = "Email is required.";
  } else if (!isEmail(email)) {
    errors.email = "Please enter a valid email address.";
  } else if (!email.endsWith("@stud.noroff.no")) {
    errors.email = "Email must be a stud.noroff.no address.";
  }

  // Password validation
  if (!password) {
    errors.password = "Please enter your password.";
  }

  if (Object.keys(errors).length > 0) {
    const firstInvalid = applyFieldErrors(dom.form, errors);
    setMessage("Please fix the errors and try again.", "error");

    if (firstInvalid && typeof firstInvalid.focus === "function") {
      firstInvalid.focus();
    }
    return;
  }

  const user = loadUser();

  //  Check stored user data
  if (
    !user ||
    !user.email ||
    user.email.toLowerCase() !== email ||
    user.password !== password
  ) {
    const authErrors = {
      email: "Email or password is incorrect.",
      password: "Email or password is incorrect.",
    };

    applyFieldErrors(dom.form, authErrors);
    setMessage("Login failed, please try again.", "error");

    if (dom.email) {
      dom.email.focus();
    }
    return;
  }

  saveAuthToken({
    accessToken: "local-login",
    email: user.email,
    name: `${user.firstName} ${user.lastName}`.trim(),
  });

  setMessage("Login successful! Redirecting...", "success");

  setTimeout(() => {
    window.location.href = "./index.html";
  }, 800);
}

/**
 * Attach input event listeners to clear errors/messages on user input.
 */
function attachFieldListeners() {
  if (!dom.form) return;

  const inputs = dom.form.querySelectorAll("input");

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      clearFieldErrors();
      if (dom.message && dom.message.dataset.type === "error") {
        setMessage("");
      }
    });
  });
}

/**
 * Entry point for the login page.
 * Attaches listeners and enables the login form interaction.
 */
function startLoginPage() {
  if (!dom.form) {
    console.warn("No [data-login-form] found on the page.");
    return;
  }

  setupFieldAccessibility();
  attachFieldListeners();
  dom.form.addEventListener("submit", handleSubmit);
}

startLoginPage();
