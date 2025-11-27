import { loadUser, saveUser } from "../utils/user-helpers.js";
import {
  validateUserProfile,
  isEmail,
  isPostalCode,
  isPhone,
} from "../utils/validators.js";

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

const errorEls = {
  firstName: document.querySelector('[data-register-error="firstName"]'),
  lastName: document.querySelector('[data-register-error="lastName"]'),
  email: document.querySelector('[data-register-error="email"]'),
  phone: document.querySelector('[data-register-error="phone"]'),
  address1: document.querySelector('[data-register-error="address1"]'),
  postalCode: document.querySelector('[data-register-error="zip"]'),
  city: document.querySelector('[data-register-error="city"]'),
  country: document.querySelector('[data-register-error="country"]'),
  password: document.querySelector('[data-register-error="password"]'),
  confirmPassword: document.querySelector(
    '[data-register-error="confirmPassword"]'
  ),
};

function clearFieldErrors() {
  Object.values(errorEls).forEach((el) => {
    if (!el) return;
    el.textContent = "";
    el.dataset.type = "";
  });
}

function showFieldErrors(error) {
  clearFieldErrors();

  const entries = Object.entries(error);
  if (entries.length === 0) return;

  const [firstField] = entries;
  const [firstFieldName] = firstField;
  const firstInput = dom[firstFieldName];
  if (firstInput && typeof firstInput.focus === "function") {
    firstInput.focus();
  }

  entries.forEach(([fieldName, message]) => {
    const el = errorEls[fieldName];
    if (!el) return;
    el.textContent = message;
    el.dataset.type = "error";
  });
}

function showMessage(text, type = "info") {
  if (!dom.message) return;
  dom.message.textContent = text;
  dom.message.dataset.type = type;
}

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

function handleSubmit(event) {
  event.preventDefault();

  const profile = buildProfileFromForm();

  const error = validateUserProfile(profile);

  const password = dom.password?.value || "";
  const confirmPassword = dom.confirmPassword?.value || "";

  if (!password) {
    error.password = "Password is required";
  } else if (password.length < 8) {
    error.password = "Password must be at least 8 characters long";
  }

  if (!confirmPassword) {
    error.confirmPassword = "Please confirm your password";
  } else if (confirmPassword !== password) {
    error.confirmPassword = "Passwords do not match";
  }

  if (
    profile.email &&
    !profile.email.toLowerCase().endsWith("@stud.noroff.no")
  ) {
    error.email = "Email must be a valid stud.noroff.no address";
  }

  if (Object.keys(error).length > 0) {
    showFieldErrors(error);
    showMessage("Please fix the errora and try again", "error");
    return;
  }

  clearFieldErrors();

  const userToSave = {
    ...profile,
    password,
  };

  saveUser(userToSave);
  showMessage("Your details have been saved", "success");
}

function startRegisterPage() {
  if (!dom.form) {
    console.warn("No [data-register-form] found on this page");
    return;
  }

  prefillIfUserExists();
  dom.form.addEventListener("submit", handleSubmit);
}

startRegisterPage();
