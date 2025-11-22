import { loadUser, saveUser } from "../utils/user-helpers";
import { validateUserProfile } from "../utils/validators";

const dom = {
  form: document.querySelector("[data-register-form]"),
  firstName: document.querySelector("[data-register-first-name]"),
  lastName: document.querySelector("[data-register-last-name]"),
  email: document.querySelector("[data-register-email]"),
  phone: document.querySelector("[data-register-phone]"),
  address1: document.querySelector("[data-register-address1]"),
  address2: document.querySelector("[data-register-address2]"),
  zip: document.querySelector("[data-register-zip]"),
  city: document.querySelector("[data-register-city]"),
  country: document.querySelector("[data-register-country]"),
  message: document.querySelector("[data-register-message]"),
};

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
    zip: dom.zip.value.trim(),
    city: dom.city.value.trim(),
    country: dom.country.value.trim(),
  };
}
