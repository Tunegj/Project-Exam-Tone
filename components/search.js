import {
  cardHTML,
  esc,
  imageUrl,
  imageAlt,
} from "../components/product-card.js";
import { money, finalPrice, isOnSale } from "../utils/price-helpers.js";

const PRODUCT_API = "https://v2.api.noroff.dev/online-shop";

let allProducts = [];
let isLoaded = false;

async function loadAllProducts() {
  if (isLoaded) return allProducts;

  try {
    const res = await fetch(PRODUCT_API);
    if (!res.ok) throw new Error("Failed to fetch products");

    const json = await res.json();
    allProducts = json.data || [];
    isLoaded = true;
    return allProducts;
  } catch (err) {
    console.error("Error loading products:", err);
    return [];
  }
}

function searchProducts(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return allProducts.filter((p) => {
    return (
      p.title.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

function renderResults(resultsContainer, items) {
  if (items.length === 0) {
    resultsContainer.innerHTML = `<p class="search-empty">No products found.</p>`;
    return;
  }

  resultsContainer.innerHTML = items.map((p) => cardHTML(p)).join("");
}

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export async function initSearch() {
  const form = document.querySelector("[data-search-form]");
  const input = form.querySelector("[data-search-input]");
  const results = document.querySelector("[data-search-results]");

  if (!form || !input || !results) return;

  await loadAllProducts();

  const handelSearch = debounce(() => {
    const query = input.value;

    if (!query.trim()) {
      results.hidden = true;
      results.innerHTML = "";
      return;
    }

    const matches = searchProducts(query);
    renderResults(results, matches);
    results.hidden = false;
  });

  input.addEventListener("input", handelSearch);

  document.addEventListener("click", (e) => {
    if (!form.contains(e.target) && !results.contains(e.target)) {
      results.hidden = true;
    }
  });
}
