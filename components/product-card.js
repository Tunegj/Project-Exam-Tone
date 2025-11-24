import { finalPrice, isOnSale, money } from "../utils/price-helpers.js";

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

// HTML generators
export function productLink(p) {
  // consistent product detail link
  return `/product.html?id=${encodeURIComponent(p?.id ?? "")}`;
}

// image helpers
export function imageUrl(p) {
  return p?.image?.url || "https://via.placeholder.com/800x500?text=No+image";
}

// alt text helper
export function imageAlt(p) {
  return p?.image?.alt || p?.title || "Product image";
}

// generate HTML snippets
export function slideHTML(p, index = 0) {
  const priceNow = money(finalPrice(p));
  const priceOld = isOnSale(p) ? money(p.price) : "";

  return `
    <article class="slide" role="group" aria-roledescription="slide" aria-label="${
      index + 1
    } of 3">
        <img class="slide__img" src="${esc(imageUrl(p))}" alt="${esc(
    imageAlt(p)
  )}"
        loading="lazy">

    <div class="slide__content">
        <h3 class="slide__title">${esc(p.title)}</h3>
        
        <div class="slide__prices">
        <span class="slide__price">${priceNow}</span>
        ${priceOld ? `<span class="slide__price--old">${priceOld}</span>` : ""}
        </div>
        <div class="slide__actions">
        <a class="product-button" href="${productLink(p)}">View Product</a>
        <button type="button" class="slide__add-button" data-product-id="${esc(
          p.id
        )}">Add to Cart</button>
        </div>
    </div>
    </article>
    `;
}

// product card for grid
export function cardHTML(p) {
  const priceNow = money(finalPrice(p));
  const priceOld = isOnSale(p) ? money(p.price) : "";

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
            <div class="card__rating">★ ${esc(p.rating ?? 0)}/5</div>
        </div>
    </a>
</article>
    `;
}
