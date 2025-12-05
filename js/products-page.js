import { cardHTML } from "../components/product-card.js";
import { isOnSale } from "../utils/price-helpers.js";
import { getProducts } from "../api/products.js";

/**
 * DOM references for the products page
 */
const dom = {
  list: document.querySelector("[data-product-list]"),
  heading: document.querySelector("[data-product-heading]"),
};

/**
 * Category group tags
 * Keys are URL slugs, values are arrays of tags.
 */
const GROUP_TAGS = {
  beauty: ["beauty", "skincare", "makeup", "fragrance"],
  accessories: ["accessories", "jewelry", "watches", "bags"],
  tech: ["electronics", "computers", "audio", "gaming"],
  fashion: ["clothing", "shoes", "apparel", "footwear"],
};

/**
 * Human-readable group labels
 */
const GROUP_LABELS = {
  beauty: "Beauty",
  accessories: "Accessories",
  tech: "Tech",
  fashion: "Fashion",
  other: "Other",
};

/**
 * Flattened set of all tags used in groups,
 * used to calculate the "other" group.
 */
const ALL_GROUP_TAGS = new Set(
  Object.values(GROUP_TAGS)
    .flat()
    .map((t) => t.toLowerCase())
);

/**
 * Read filters from URL query string.
 * Supports:
 * - ?search=...
 * - ?tag=...
 * - ?sale=true
 * - ?group=beauty|accessories|tech|other
 *
 * @returns {{search: string, tag: string, sale: boolean, group: string}}
 */
function getFilters() {
  const params = new URLSearchParams(window.location.search);

  return {
    search: params.get("search") || "",
    tag: params.get("tag") || "",
    sale: params.get("sale") === "true",
    group: params.get("group") || "",
  };
}

/**
 * Check if a product is on sale, supporting both:
 * - a bollean p.isOnSale
 * - pricing via price-helpers
 * @param {Object} product
 * @returns {boolean}
 */
function isProductOnSale(product) {
  if (typeof product.isOnSale === "boolean") {
    return product.isOnSale;
  }
  return isOnSale(product);
}

/**
 * Filter products by a group slug from the URL, e.g "beauty"
 * -If groupSlug is null/empty or unkown, returns all products.
 * -If groupSlug is "other", returns products that do not have any tags in known groups.
 * @param {Array<Object>} products
 * @param {string} groupSlug
 * @returns {Array<Object>}
 */
function filterByGroup(products, groupSlug) {
  if (!groupSlug) return products;

  const slug = groupSlug.toLowerCase();

  if (slug === "other") {
    return products.filter((p) => {
      const tags = (p.tags || []).map((t) => t.toLowerCase());
      return !tags.some((tag) => ALL_GROUP_TAGS.has(tag));
    });
  }

  const allowedTags = GROUP_TAGS[slug];
  if (!allowedTags) return products;

  return products.filter((p) => {
    const tags = (p.tags || []).map((t) => t.toLowerCase());
    return tags.some((tag) => allowedTags.includes(tag));
  });
}

/**
 * Apply all active filters to the products list.
 * @param {Array<Object>} products
 * @param {{search: string, tag: string, sale: boolean, group: string}} param1
 * @returns {Array<Object>}
 */
function filterProducts(products, { search, tag, sale, group }) {
  let results = [...products];

  if (group) {
    results = filterByGroup(results, group);
  }

  if (sale) {
    results = results.filter((p) => isProductOnSale(p));
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

/**
 * Render the list of products to the DOM.
 * @param {Array<Object>} products
 */
function renderProducts(products) {
  if (!dom.list) return;

  if (!products.length) {
    dom.list.innerHTML = `<p class="product-list__empty">No products found.</p>`;
    return;
  }
  dom.list.innerHTML = products.map((p) => cardHTML(p)).join("");
}

/**
 * Update the heading text based on active filters and product count.
 *
 * Priority:
 * 1. Search
 * 2. Tag
 * 3. Group
 * 4. Sale
 * 5. Default "All Products"
 * @param {{search: string, tag: string, sale: boolean, group: string}} filters
 * @param {number} count
 */
function updateHeading(filters, count) {
  if (!dom.heading) return;

  if (filters.search) {
    dom.heading.textContent = `Showing ${count} result${
      count === 1 ? "" : "s"
    } for "${filters.search}"`;
    return;
  }

  if (filters.tag) {
    dom.heading.textContent = `Category: ${filters.tag} (${count})`;
    return;
  }

  if (filters.group) {
    const slug = filters.group.toLowerCase();
    const label = GROUP_LABELS[slug] || filters.group;
    dom.heading.textContent = `Category: ${label} (${count})`;
    return;
  }

  if (filters.sale) {
    dom.heading.textContent = `On Sale Products (${count})`;
    return;
  }

  dom.heading.textContent = `All Products (${count})`;
}

/**
 * Entry point for the products page.
 * - Loads products from API
 * - Reads filters from URL
 * - Applies filters
 * - Renders products and updates heading
 */
(async function startProductsPage() {
  try {
    const filters = getFilters();
    const products = await getProducts();
    const filtered = filterProducts(products, filters);
    renderProducts(filtered);
    updateHeading(filters, filtered.length);
  } catch (err) {
    console.error("Error loading products:", err);
    if (dom.list) {
      dom.list.innerHTML = `<p class="product-list__error">Failed to load products. Please try again later.</p>`;
    }
  }
})();
