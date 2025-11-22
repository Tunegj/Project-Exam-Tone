export function isRequired(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateUserProfile() {
  if (!isRequired(profile.firstName)) {
    return "Please enter your first name";
  }

  if (!isRequired(profile.lastName)) {
    return "Please enter your last name";
  }

  if (!isRequired(profile.email)) {
    return "Please enter your email";
  }

  if (!isRequired(profile.address1)) {
    return "Please enter your address";
  }

  if (!isRequired(profile.zip)) {
    return "Please enter your zip code";
  }

  if (!isRequired(profile.city)) {
    return "Please enter your city";
  }

  if (!isRequired(profile.country)) {
    return "Please enter your country";
  }

  return null;
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
