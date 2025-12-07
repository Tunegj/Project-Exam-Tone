import { isLoggedIn } from "../utils/auth.js";
import { getProductById } from "../api/products.js";

/**
 * @typedef {Object} ReviewDomMap
 * @property {HTMLFormElement|null} form
 * @property {HTMLElement|null} message
 * @property {HTMLElement|null} errorRating
 * @property {HTMLElement|null} errorText
 * @property {HTMLElement|null} starsWrapper
 * @property {HTMLElement|null} heading
 */

/**
 * DOM elements used in the review form handling.
 * @type {ReviewDomMap}
 */
const dom = {
  form: document.querySelector("[data-review-form]"),
  message: document.querySelector("[data-review-message]"),
  errorRating: document.querySelector("[data-error-rating]"),
  errorText: document.querySelector("[data-error-text]"),
  starsWrapper: document.querySelector("[data-stars]"),
  heading: document.querySelector("[data-review-heading]"),
};

/**
 * Extracts the product ID from the URL query string
 * @returns {string||null} The product ID or null if not found
 */
function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  return id ? id.trim() : null;
}

/**
 * Load product details to personalise the reivew form heading..
 * Falls back to a generic heading if product cannot be loaded.
 * @returns {Promise<void>}
 */
async function loadProductForReview() {
  const id = getProductIdFromUrl();
  const heading = dom.heading;

  if (!id || !heading) return;

  try {
    const product = await getProductById(id);

    if (product?.title) {
      heading.textContent = `Write a review for ${product.title}`;
    } else {
      heading.textContent = "Write a review";
    }
  } catch (err) {
    console.error("Could not load product for review:", err);
    heading.textContent = "Write a review";
  }
}

/**
 * Set up a globak message for the review form.
 * Used for login requirements and success messages.
 * @param {string} text - Text to show the user
 * @param {"info"|"error"|"success"|""} [type=""] - The type of message
 */
function setMessage(text, type = "") {
  if (!dom.message) return;
  dom.message.textContent = text || "";
  dom.message.dataset.type = type || "";
}

/**
 * Set a field-level error message.
 *
 * @param {HTMLElement|null} el - Error element for the field
 * @param {string} msg - Error message to show
 */
function setFieldError(el, msg) {
  if (!el) return;
  el.textContent = msg || "";
}

/**
 * Clear all field-level errors.
 */
function clearFieldErrors() {
  setFieldError(dom.errorRating, "");
  setFieldError(dom.errorText, "");
}

/**
 * Guard the review form to ensure user is logged in.
 * Shows a message and disables the form if not logged in.
 */
function setupLoginGuard() {
  if (!dom.form) return;

  if (!isLoggedIn()) {
    setMessage("You must be logged in to submit a review.", "error");
    dom.form.setAttribute("aria-disabled", "true");
  } else {
    setMessage("");
    dom.form.removeAttribute("aria-disabled");
  }
}

/**
 * Set up the interactive star rating UI:
 * - Clicking a star sets the rating
 * - Highlights stars up to the selected rating
 */
function setUpStars() {
  if (!dom.starsWrapper) return;

  const starLabels = Array.from(dom.starsWrapper.querySelectorAll(".star"));

  /**
   * Update the visual state of the stars based on the rating.
   * @param {number} rating - The current rating value
   */
  function updateVisual(rating) {
    starLabels.forEach((label) => {
      const input = label.querySelector("input");
      const value = Number(input?.value || 0);
      label.classList.toggle("star--active", value <= rating);
    });
  }

  starLabels.forEach((label) => {
    const input = label.querySelector("input");
    if (!input) return;

    label.addEventListener("click", () => {
      const value = Number(input.value || 0);
      updateVisual(value);
    });

    input.addEventListener("change", () => {
      const value = Number(input.value || 0);
      updateVisual(value);
    });
  });
}

/**
 * Get the selected rating value from the radio inputs.
 *
 * @returns {number} The selected rating value
 */
function getSelectedRating() {
  const checked = document.querySelector('input[name="rating"]:checked');
  if (!checked) return 0;
  return Number(checked.value || 0);
}

/**
 * Wire up form submission:
 * - Validates rating and text
 * - Shows inline errrors
 * - Prevents submission if the user is not logged in
 * - Shows a success message and clears UI on success
 */
function setupFormSubmit() {
  if (!dom.form) return;

  const textarea = dom.form.querySelector("#review-text");

  dom.form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (dom.form.getAttribute("aria-disabled") === "true") return;

    clearFieldErrors();
    setMessage("");

    const rating = getSelectedRating();
    const text = (textarea?.value || "").trim();

    let hasError = false;
    let firstErrorEl = null;

    if (!rating || rating < 1 || rating > 5) {
      setFieldError(dom.errorRating, "Please select a rating between 1 and 5.");
      hasError = true;
      firstErrorEl = firstErrorEl || dom.starsWrapper;
    }

    if (!text) {
      setFieldError(dom.errorText, "Please write a short review.");
      hasError = true;
      firstErrorEl = firstErrorEl || textarea;
    } else if (text.length < 5) {
      setFieldError(
        dom.errorText,
        "Your review is a bit too short – please add a little more detail."
      );
      hasError = true;
    } else {
      setFieldError(dom.errorText, "");
      firstErrorEl = firstErrorEl || textarea;
    }

    if (hasError) {
      if (firstErrorEl && "focus" in firstErrorEl) {
        firstErrorEl.focus();
      }
      return;
    }

    // "Fake" submission – no persistence required for exam
    // This is intentionally not saved anywhere in storage or API.
    setMessage("Thank you for your review!", "success");

    dom.form.reset();
    setTimeout(() => {
      window.location.href = "/Project-Exam-Tone/index.html";
    }, 2000);

    if (dom.starsWrapper) {
      const activeStars = dom.starsWrapper?.querySelectorAll(".star--active");
      activeStars.forEach((label) => label.classList.remove("star--active"));
    }
  });
}

/**
 * Main entrty point for the review page.
 * - Guards form by login state.
 * - Sets up star rating UI.
 * - Wires up form submission handling.
 * - Loads product details for personalising the heading.
 */
document.addEventListener("DOMContentLoaded", async () => {
  setupLoginGuard();
  setUpStars();
  setupFormSubmit();
  await loadProductForReview();
});
