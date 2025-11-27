import { loadUser } from "../utils/user-helpers.js";
import { isEmail } from "../utils/validators.js";

/**
 * DOM references used in the login page
 * @type {Object}
 */
const dom = {
  form: document.querySelector("[data-login-form]"),
  email: document.querySelector("[data-login-email]"),
  password: document.querySelector("[data-login-password]"),

  emailError: document.querySelector('[data-login-error="email"]'),
  passwordError: document.querySelector('[data-login-error="password"]'),
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
 * Clear all inline filed errors and remove aria-invalid
 * from the email and password fields.
 */
function clearFieldErrors() {
  if (dom.emailError) {
    dom.emailError.textContent = "";
    dom.emailError.dataset.type = "";
  }

  if (dom.passwordError) {
    dom.passwordError.textContent = "";
    dom.passwordError.dataset.type = "";
  }

  if (dom.email) {
    dom.email.removeAttribute("aria-invalid");
  }

  if (dom.password) {
    dom.password.removeAttribute("aria-invalid");
  }
}

/**
 * Show a validation error message for a specific field.
 * Also marks the input as aria-invalid for accessibility.
 *
 * @param {"email"|"password"} field - Which field to show the error for.
 * @param {string} message - The error message to display.
 */
function showFieldError(field, message) {
  if (field === "email" && dom.emailError) {
    dom.emailError.textContent = message;
    dom.emailError.dataset.type = "error";
    if (dom.email) {
      dom.email.setAttribute("aria-invalid", "true");
    }
  }
  if (field === "password" && dom.passwordError) {
    dom.passwordError.textContent = message;
    dom.passwordError.dataset.type = "error";
    if (dom.password) {
      dom.password.setAttribute("aria-invalid", "true");
    }
  }
}

/**
 * Handle the login form submission.
 * Validates input, checks stored user data, and redirects on success.
 *
 * @param {SubmitEvent} event - The form submission event.
 */
function handleSubmit(event) {
  event.preventDefault();
  clearFieldErrors();
  setMessage("");

  const email = dom.email?.value.trim().toLowerCase() || "";
  const password = dom.password?.value || "";

  let hasError = false;

  // Email validation
  if (!email) {
    showFieldError("email", "Email is required.");
    hasError = true;
  } else if (!isEmail(email)) {
    showFieldError("email", "Please enter a valid email address.");
    hasError = true;
  } else if (!email.endsWith("@stud.noroff.no")) {
    showFieldError("email", "Email must be a stud.noroff.no address.");
    hasError = true;
  }

  // Password validation
  if (!password) {
    showFieldError("password", "Please enter your password.");
    hasError = true;
  }

  if (hasError) {
    setMessage("Please fix the errors and try again.", "error");
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
    showFieldError("email", "Email or password is incorrect.");
    showFieldError("password", "Email or password is incorrect.");
    setMessage("Log in failed, please try again", "error");
    return;
  }

  setMessage("Login successful! Redirecting...", "success");

  setTimeout(() => {
    window.location.href = "../index.html";
  }, 800);
}

/**
 * Attach input event listeners to clear errors/messages on user input.
 */
function attachFieldListeners() {
  if (dom.email) {
    dom.email.addEventListener("input", () => {
      clearFieldErrors();
      if (dom.message && dom.message.dataset.type === "error") {
        setMessage("");
      }
    });
  }

  if (dom.password) {
    dom.password.addEventListener("input", () => {
      clearFieldErrors();
      if (dom.message && dom.message.dataset.type === "error") {
        setMessage("");
      }
    });
  }
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

  attachFieldListeners();
  dom.form.addEventListener("submit", handleSubmit);
}
startLoginPage();
