import { cardHTML } from "../components/product-card.js";
import { isOnSale } from "../utils/price-helpers.js";

const PRODUCT_API = "https://v2.api.noroff.dev/online-shop";

const dom = {
  list: document.querySelector("[data-product-list]"),
  heading: document.querySelector("[data-product-heading]"),
};

function getFilters() {
  const params = new URLSearchParams(window.location.search);

  return {
    search: params.get("search") || "",
    tag: params.get("tag") || "",
    sale: params.get("sale") === "true",
  };
}

async function fetchProducts() {
  const res = await fetch(PRODUCT_API);
  if (!res.ok) throw new Error("Failed to fetch products");

  const json = await res.json();
  return json.data || [];
}

function filterProducts(products, { search, tag, sale }) {
  let results = [...products];

  if (sale) {
    results = results.filter((p) => {
      if (typeof p.isOnSale === "boolean") return p.isOnSale;
      if (p.discountedPrice != null && p.price != null) {
        return Number(p.discountedPrice) < Number(p.price);
      }
      return isOnSale(p);
    });
  }

  if (tag) {
    const t = tag.toLowerCase();
    results = results.filter((p) =>
      (p.tags || []).some((x) => x.toLowerCase() === t)
    );
  }

  if (search) {
    const q = search.toLowerCase();
    results = results.filter((p) => {
      const title = p.title?.toLowerCase() ?? "";
      const desc = p.description?.toLowerCase() ?? "";
      const tags = (p.tags || []).map((t) => t.toLowerCase());
      return (
        title.includes(q) || desc.includes(q) || tags.some((t) => t.includes(q))
      );
    });
  }

  return results;
}

function renderProducts(products) {
  if (!dom.list) return;

  dom.list.innerHTML = products.length
    ? products.map((p) => cardHTML(p)).join("")
    : "<p>No products found.</p>";
}

function updateHeading(filters, count) {
  if (!dom.heading) return;

  if (filters.search) {
    dom.heading.textContent = `Showing ${count} result${
      count === 1 ? "" : "s"
    } for "${filters.search}"`;
  } else if (filters.tag) {
    dom.heading.textContent = `Category: ${filters.tag} (${count})`;
  } else if (filters.sale) {
    dom.heading.textContent = `Products on Sale (${count})`;
  } else {
    dom.heading.textContent = `All Products (${count})`;
  }
}

(async function startProductsPage() {
  try {
    const filters = getFilters();
    const products = await fetchProducts();
    const filtered = filterProducts(products, filters);
    renderProducts(filtered);
    updateHeading(filters, filtered.length);
  } catch (err) {
    console.error("Error loading products:", err);
  }
})();
