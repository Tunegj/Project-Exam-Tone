import { finalPrice, isOnSale, money } from "../utils/price-helpers.js";

/**
 * Escape HTML special characters to prevent injection in templates.
 * @param {string} text
 * @returns {string}
 */
export function esc(text) {
  return String(text ?? "").replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m])
  );
}

/**
 * Build a consistent product detail URL.
 * @param {Object} p - Product object.
 * @returns {string} URL string.
 */
export function productLink(p) {
  return `./product.html?id=${encodeURIComponent(p?.id ?? "")}`;
}

/**
 * Get the best available image URL for a product, or a placeholder.
 * @param {Object} p - Product object.
 * @returns {string} Image URL.
 */
export function imageUrl(p) {
  return p?.image?.url || "https://via.placeholder.com/800x500?text=No+image";
}

/**
 * Get accessible alt text for a product image.
 * @param {Object} p - Product object.
 * @returns {string} Alt text.
 */
export function imageAlt(p) {
  return p?.image?.alt || p?.title || "Product image";
}

/**
 * Generate HTML for a product slide.
 * @param {Object} p - Product object.
 * @param {number} index - Zero-based index of the slide.
 * @param {number} [totalSlides=3] - Total number of slides.
 * @returns {string} HTML string.
 */
export function slideHTML(p, index = 0, totalSlides = 3) {
  const priceNow = money(finalPrice(p));
  const priceOld = isOnSale(p) ? money(p.price) : "";

  const rotateClass =
    p.id === "f99cafd2-bd40-4694-8b33-a6052f36b435"
      ? "slide__img--rotated"
      : "";

  const slideNumber = index + 1;
  const ariaLabel =
    totalSlides && Number.isFinite(totalSlides)
      ? `slide ${slideNumber} of ${totalSlides}`
      : `slide ${slideNumber}`;

  return `
    <article class="slide" role="group" aria-roledescription="slide" aria-label="${esc(
      ariaLabel
    )}">
    <div class="slide__image-wrap">
        <img class="slide__img ${rotateClass}" src="${esc(
    imageUrl(p)
  )}" alt="${esc(imageAlt(p))}"
        loading="lazy">
    </div>
    <div class="slide__content">
        <h3 class="slide__title">${esc(p.title)}</h3>
        
        <div class="slide__prices">
        <span class="slide__price">${priceNow}</span>
        ${priceOld ? `<span class="slide__price--old">${priceOld}</span>` : ""}
        </div>

        <div class="slide__actions">
        <a class="product-button" href="${productLink(p)}">View Product</a>
        <button
          type="button"
          class="slide__add-button"
          data-add-to-cart
          data-product-id="${esc(p.id)}"
          aria-label="Add ${esc(p.title)} to cart"
          >
        Add to cart
        </button>
        </div>
    </div>
    </article>
    `;
}

/**
 * Generate HTML for a product card in the grid.
 * @param {Object} p - Product object.
 * @returns {string} HTML string.
 */
export function cardHTML(p) {
  const priceNow = money(finalPrice(p));
  const priceOld = isOnSale(p) ? money(p.price) : "";
  const rating = p.rating ?? 0;

  return `
  <article class="product-card">
     <a class="card-link" href="${productLink(p)}" aria-label="${esc(p.title)}">
        <img class="card__img" src="${esc(imageUrl(p))}" alt="${esc(
    imageAlt(p)
  )}"
        loading="lazy">

        <div class="card__body">
            <h3 class="card__title">${esc(p.title)}</h3>

            <div class="card__prices">
                <span class="card__price">${priceNow}</span>
                ${
                  priceOld
                    ? `<span class="card__price--old">${priceOld}</span>`
                    : ""
                }
            </div>

            <div class="card__rating" aria-label="Rated ${esc(
              rating
            )} out of 5">
            <span aria-hidden="true">★ ${esc(rating)}/5</span></div>
        </div>
    </a>
</article>
    `;
}
