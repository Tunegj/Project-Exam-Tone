import { isLoggedIn } from "../utils/auth.js";
import { getProductById } from "../api/products.js";

const dom = {
  form: document.querySelector("[data-review-form]"),
  message: document.querySelector("[data-review-message]"),
  errorRating: document.querySelector("[data-error-rating]"),
  errorText: document.querySelector("[data-error-text]"),
  starsWrapper: document.querySelector("[data-stars]"),
};

async function loadProductForReview() {
  const heading = document.querySelector("[data-review-heading]");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

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

function setMessage(text, type = "") {
  if (!dom.message) return;
  dom.message.textContent = text;
  dom.message.dataset.type = type;
}

function setFieldError(el, msg) {
  if (!el) return;
  el.textContent = msg || "";
}

function setupLoginGuard() {
  if (!dom.form) return;

  if (!isLoggedIn()) {
    setMessage("You must be logged in to submit a review.", "error");
    dom.form.setAttribute("aria-disabled", "true");
  } else {
    setMessage("");
  }
}

function setUpStars() {
  if (!dom.starsWrapper) return;

  const starLabels = Array.from(dom.starsWrapper.querySelectorAll(".star"));

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

function getSelectedRating() {
  const checked = document.querySelector('input[name="rating"]:checked');
  if (!checked) return 0;
  return Number(checked.value || 0);
}

function setupFormSubmit() {
  if (!dom.form) return;

  dom.form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (dom.form.getAttribute("aria-disabled") === "true") return;

    const rating = getSelectedRating();
    const text = (
      dom.form.querySelector("#review-text") || { value: "" }
    ).value.trim();

    let hasError = false;

    if (!rating || rating < 1 || rating > 5) {
      setFieldError(dom.errorRating, "Please select a rating between 1 and 5.");
      hasError = true;
    } else {
      setFieldError(dom.errorRating, "");
    }

    if (!text) {
      setFieldError(dom.errorText, "Please write a short review.");
      hasError = true;
    } else if (text.length < 5) {
      setFieldError(
        dom.errorText,
        "Your review is a bit too short – please add a little more detail."
      );
      hasError = true;
    } else {
      setFieldError(dom.errorText, "");
    }

    if (hasError) return;

    console.log("fake review submitted:", { rating, text });

    setMessage("Thank you for your review!", "success");

    dom.form.reset();

    const activeStars =
      dom.starsWrapper?.querySelectorAll(".star--active") || [];
    activeStars.forEach((label) => label.classList.remove("star--active"));
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  setupLoginGuard();
  setUpStars();
  setupFormSubmit();
  await loadProductForReview();
});
