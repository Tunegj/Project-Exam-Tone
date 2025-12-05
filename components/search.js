import {
  cardHTML,
  esc,
  imageUrl,
  imageAlt,
} from "../components/product-card.js";
import { money, finalPrice, isOnSale } from "../utils/price-helpers.js";

export function initSearch(root = document) {
  const form = root.querySelector("[data-search-form]");
  const input = root.querySelector("[data-search-input]");

  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const query = input.value.trim();
    if (query) return;

    const url = new URL("/products.html", window.location.origin);
    url.searchParams.set("search", query);
    window.location.href = url.toString();
  });
}
