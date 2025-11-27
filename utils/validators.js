export function isRequired(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isPostalCode(value) {
  return /^[A-Za-z0-9 -]{3,10}$/.test(value);
}

export function isPhone(value) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return /^[0-9+\-\s]{5,20}$/.test(trimmed);
}

/**
 * Validate a user profile object.
 *
 * @param {Object} profile
 * @returns {Object} errors - e.g. { firstName: "Please enter...", email: "Invalid..." }
 */

export function validateUserProfile(profile) {
  const errors = {};

  // firstName
  if (!isRequired(profile.firstName)) {
    errors.firstName = "Please enter your first name.";
  }

  // lastName
  if (!isRequired(profile.lastName)) {
    errors.lastName = "Please enter your last name.";
  }

  // email
  if (!isRequired(profile.email)) {
    errors.email = "Please enter your email.";
  } else if (!isEmail(profile.email)) {
    errors.email = "Please enter a valid email address.";
  }

  // phone (optional, but validate if present)
  if (!isPhone(profile.phone)) {
    errors.phone = "Please enter a valid phone number.";
  }

  // address1
  if (!isRequired(profile.address1)) {
    errors.address1 = "Please enter your address.";
  }

  // zip
  if (!isRequired(profile.postalCode)) {
    errors.postalCode = "Please enter your zip code.";
  } else if (!isPostalCode(profile.postalCode)) {
    errors.postalCode = "Please enter a valid zip code.";
  }

  // city
  if (!isRequired(profile.city)) {
    errors.city = "Please enter your city.";
  }

  // country
  if (!isRequired(profile.country)) {
    errors.country = "Please enter your country.";
  }

  return errors;
}

// function validateForm() {
//   if (!dom.firstName.value.trim()) {
//     showMessage("Please enter your first name.", "error");
//     dom.firstName.focus();
//     return false;
//   }
//   if (!dom.lastName.value.trim()) {
//     showMessage("Please enter your last name.", "error");
//     dom.lastName.focus();
//     return false;
//   }
//   if (!dom.email.value.trim()) {
//     showMessage("Please enter your email.", "error");
//     dom.email.focus();
//     return false;
//   }

//   if (!dom.address1.value.trim()) {
//     showMessage("Please enter your address", "error");
//     dom.address1.focus();
//     return false;
//   }

//   if (!dom.zip.value.trim()) {
//     showMessage("Please enter your zip code", "error");
//     dom.zip.focus();
//     return false;
//   }

//   if (!dom.city.value.trim()) {
//     showMessage("Please enter your city", "error");
//     dom.city.focus();
//     return false;
//   }

//   if (!dom.country.value.trim()) {
//     showMessage("Please enter your country", "error");
//     dom.country.focus();
//     return false;
//   }

//   return true;
// }
