/**
 * Base URL for the Noroff online shop API
 * @type {string}
 */
const PRODUCT_API_URL = "https://v2.api.noroff.dev/online-shop";

import { finalPrice, isOnSale, money } from "../utils/price-helpers.js";
import { getProductById } from "../api/products.js";
import { cardHTML } from "../components/product-card.js";
import { addToCart, loadCart } from "../utils/cart-helper.js";
import { updateCartCount } from "../utils/cart-ui.js";
import { isLoggedIn } from "../utils/auth.js";

/**
 * @typedef {Object} ProductImage
 * @property {string} [url] - Image URL
 * @property {string} [alt] - Alternative text for the image
 */

/**
 * @typedef {Object} ProductReview
 * @property {string} [username] - Reviewer's username
 * @property {string} [description] - Review text
 * @property {number} [rating] - Rating value (1-5)
 */

/**
 * @typedef {Object} Product
 * @property {string} id - Product ID
 * @property {string} [title] - Product title
 * @property {string} [description] - Product description
 * @property {number} [price] - Base product price
 * @property {number} [discountedPrice] - Discounted price if on sale
 * @property {number} [rating] - Average product rating
 * @property {ProductImage} [image] - Product image details
 * @property {string[]} [tags] - Array of product tags
 * @property {ProductReview[]} [reviews] - Array of product reviews
 * @property {number} [quantity] - Optional quantity (if used in cart context)
 */

/**
 * @typedef {Object} ProductDomMap
 * @property {HTMLImageElement||null} image - Product image element
 * @property {HTMLElement||null} title - Product title element
 * @property {HTMLElement||null} description - Product description element
 * @property {HTMLElement||null} price - Product price element
 * @property {HTMLElement||null} oldPrice - Product old price element
 * @property {HTMLElement||null} rating - Product rating element
 * @property {HTMLButtonElement||null} addToCartBtn - Add to cart button element
 * @property {HTMLElement||null} loading - Loading state element
 * @property {HTMLElement||null} content - Content container element
 * @property {HTMLElement||null} error - Error message element
 * @property {HTMLElement||null} reviewsList - Reviews list container
 * @property {HTMLElement||null} reviewsEmpty - Reviews empty state element
 * @property {HTMLElement||null} reviewsCount - Reviews count element
 * @property {HTMLElement||null} similarList - Similar products list container
 * @property {HTMLElement||null} similarEmpty - Similar products empty state element
 * @property {HTMLElement||null} tags - Product tags container
 * @property {HTMLElement||null} root - Root element for the product page
 * @property {HTMLButtonElement||null} shareBtn - Share product button
 * @property {HTMLElement||null} shareStatus - Share status message element
 */

/**
 * Cached DOM references for the product page
 * @type {ProductDomMap}
 */
const dom = {
  image: document.querySelector("[data-product-image]"),
  title: document.querySelector("[data-product-title]"),
  description: document.querySelector("[data-product-description]"),
  price: document.querySelector("[data-product-price]"),
  oldPrice: document.querySelector("[data-product-old-price]"),
  rating: document.querySelector("[data-product-rating]"),
  addToCartBtn: document.querySelector("[data-add-to-cart]"),

  loading: document.querySelector("[data-product-loading]"),
  content: document.querySelector("[data-product-content]"),
  error: document.querySelector("[data-product-error]"),
  reviewsList: document.querySelector("[data-reviews-list]"),
  reviewsEmpty: document.querySelector("[data-reviews-empty]"),
  reviewsCount: document.querySelector("[data-reviews-count]"),
  reviewLink: document.querySelector("[data-review-link]"),

  similarList: document.querySelector("[data-similar-list]"),
  similarEmpty: document.querySelector("[data-similar-empty]"),

  tags: document.querySelector("[data-product-tags]"),

  root: document.querySelector("[data-product-root]"),

  shareBtn: document.querySelector("[data-share-product]"),
  shareStatus: document.querySelector("[data-share-status]"),
};

/**
 * Set the overall page state to loading / error / content.
 *
 * @param {{ isLoading?: boolean, isError?: boolean }} options - Page state flags
 * @returns {void}
 */
function setPageState({ isLoading = false, isError = false }) {
  if (dom.loading) {
    dom.loading.hidden = !isLoading;
  }

  if (dom.error) {
    dom.error.hidden = !isError;
  }

  if (dom.content) {
    dom.content.hidden = isLoading || isError;
  }
}

/**
 * Render a star rating as HTML.
 *
 * @param {number|string} value - Rating value (1-5)
 * @returns {string} HTML string representing the star rating
 */
function renderStars(value) {
  const rating = Number(value) || 0;
  const max = 5;
  let html = "";

  for (let i = 1; i <= max; i++) {
    html += `<span aria-hidden="true">${i <= rating ? "★" : "☆"}</span>`;
  }

  return html;
}

/**
 * Render the list of reviews for a product.
 *
 * @param {Product} product - Product object with optional reviews
 * @returns {void}
 */
function renderReviews(product) {
  const list = dom.reviewsList;
  const empty = dom.reviewsEmpty;

  if (!list || !empty) return;

  const reviews = Array.isArray(product.reviews) ? product.reviews : [];

  if (reviews.length === 0) {
    list.innerHTML = "";
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  list.innerHTML = reviews
    .map((review) => {
      const username = review.username || "Anonymous";
      const description = review.description || "";
      const rating = Number(review.rating) || 0;

      return `
      <article class="review">
        <header class="review__header">
          <h3 class="review__user">${username}</h3>
          <p class="review__rating" aria-label="Rated ${rating} out of 5">
            ${renderStars(rating)}
          </p>
        </header>
        <p class="review__description">${description}</p>
      </article>`;
    })
    .join("");
}

/**
 * Render product tags
 *
 * @param {Product} product - Product object with optional tags array
 * @returns {void}
 */

function renderTags(product) {
  if (!dom.tags) return;

  const tags = Array.isArray(product.tags) ? product.tags : [];

  if (tags.length === 0) {
    dom.tags.innerHTML = "";
    dom.tags.hidden = true;
    return;
  }

  dom.tags.hidden = false;

  dom.tags.innerHTML = tags
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join("");
}

/**
 * Render the main product details section:
 * title, description, image, price, sale info, rating,
 * and the initial state of the Add to Cart button.
 * @param {Product} product - Product to render.
 * @returns {void}
 */
function renderProduct(product) {
  if (!product) return;

  if (dom.title) {
    dom.title.textContent = product.title ?? "Untitled product";
  }

  if (dom.description) {
    dom.description.textContent = product.description ?? "";
  }

  if (dom.image) {
    const url =
      product.image?.url || "https://via.placeholder.com/800x600?text=No+image";
    const alt = product.image?.alt || product.title || "Product Image";

    dom.image.src = url;
    dom.image.alt = alt;
  }

  const current = finalPrice(product);
  const original = product.price ?? current;
  const onSale = isOnSale(product);

  if (dom.price) {
    dom.price.textContent = money(current);
  }

  if (dom.oldPrice) {
    if (onSale) {
      dom.oldPrice.textContent = money(original);
      dom.oldPrice.style.display = "";
    } else {
      dom.oldPrice.textContent = "";
      dom.oldPrice.style.display = "none";
    }
  }

  if (dom.rating) {
    const rating = product.rating ?? 0;
    dom.rating.innerHTML = renderStars(rating);
    dom.rating.setAttribute("aria-label", `Rating ${rating} out of 5`);
  }

  if (dom.addToCartBtn) {
    if (isLoggedIn()) {
      dom.addToCartBtn.textContent = "Add to cart";
      dom.addToCartBtn.disabled = false;
      dom.addToCartBtn.hidden = false;
      dom.addToCartBtn.dataset.loginRequired = "false";
    } else {
      dom.addToCartBtn.textContent = "Log in to shop";
      dom.addToCartBtn.disabled = false;
      dom.addToCartBtn.hidden = false;
      dom.addToCartBtn.dataset.loginRequired = "true";
    }
  }

  if (dom.reviewLink && product?.id) {
    dom.reviewLink.href = `/review.html?id=${encodeURIComponent(product.id)}`;
  }

  renderTags(product);
}

/**
 * Read the product ID from the current page URL.
 *
 * @returns {string||null} Product ID string, or null if missing.
 */
function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  return id ? id.trim() : null;
}

/**
 * Fetch all products from the API.
 *
 * @returns {Promise<Product[]>} Promise that resolves to a product array.
 * @throws {Error} If the API request fails.
 */
async function fetchAllProducts() {
  const res = await fetch(PRODUCT_API_URL);

  if (!res.ok) {
    throw new Error(`API error ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  return json.data || [];
}

/**
 * Find similar products based on the shared tags with the current product.
 *
 * Falls back to a simple slice of "other" products if no tags match.
 *
 * @param {Product} currentProduct - The product being viewed.
 * @param {Product[]} allProducts - All products from the API.
 * @param {number} [maxItems=4] - Maximum number of similar products to return.
 * @returns {Product[]} Array of similar products.
 */
function getSimilarProducts(currentProduct, allProducts, maxItems = 4) {
  const currentTags = Array.isArray(currentProduct.tags)
    ? currentProduct.tags
    : [];

  const others = allProducts.filter((p) => p.id !== currentProduct.id);

  if (currentTags.length === 0) {
    return others.slice(0, maxItems);
  }

  const scored = others
    .map((product) => {
      const productTags = Array.isArray(product.tags) ? product.tags : [];

      const sharedTagsCount = productTags.filter((tag) =>
        currentTags.includes(tag)
      ).length;

      return {
        ...product,
        _similarityScore: sharedTagsCount,
      };
    })

    .filter((product) => product._similarityScore > 0)
    .sort((a, b) => b._similarityScore - a._similarityScore);

  if (scored.length === 0) {
    return others.slice(0, maxItems);
  }

  return scored.slice(0, maxItems);
}

/**
 * Render the "similar products" list for the product page.
 *
 * @param {Product[]} similarProducts - Products to show as recommendations.
 * @returns {void}
 */
function renderSimilarProducts(similarProducts) {
  const list = dom.similarList;
  const empty = dom.similarEmpty;

  if (!list) return;

  if (!similarProducts || similarProducts.length === 0) {
    list.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;

  list.innerHTML = similarProducts.map((p) => cardHTML(p)).join("");
}

/**
 * Wire up the "Add to cart" button for the current product.
 *
 * - If the user is not logged in, redirects to login page.
 * - Otherwise, add one unit to cart and show a short feedback state.
 *
 * @param {Product} product - Product to add to cart.
 * @returns {void}
 */
function setupAddToCart(product) {
  if (!dom.addToCartBtn) return;

  dom.addToCartBtn.addEventListener("click", () => {
    if (!isLoggedIn()) {
      window.location.href = "../account/login.html";
      return;
    }

    dom.addToCartBtn.disabled = true;
    const originalLabel = dom.addToCartBtn.textContent;
    dom.addToCartBtn.textContent = "Adding...";

    try {
      addToCart(product, 1);
      updateCartCount(loadCart());

      dom.addToCartBtn.textContent = "Added!";
      setTimeout(() => {
        dom.addToCartBtn.disabled = false;
        dom.addToCartBtn.textContent = originalLabel;
      }, 1000);
    } catch (error) {
      console.error("Could not add to cart:", error);
      dom.addToCartBtn.textContent = "Error";
      setTimeout(() => {
        dom.addToCartBtn.disabled = false;
        dom.addToCartBtn.textContent = originalLabel;
      }, 1000);
    }
  });
}

/**
 * Build a shareable product URL for a given product ID,
 * preserving the current origin and path.
 *
 * @param {string} productId - ID of the product to link to.
 * @returns {string} Shareable URL for the product.
 */
function buildProductUrl(productId) {
  const url = new URL(window.location.href);
  url.searchParams.set("id", productId);
  return url.toString();
}

/**
 * Wire up the product share button:
 * - Tries Clipboard API in secure contexts
 * - Falls back to a hidden textarea copy method
 * - Last resort: prompt with URL to copy manually
 *
 * @param {Product} product - Product to share.
 * @returns {void}
 */
function setupShareLink(product) {
  if (!dom.shareBtn) return;

  const productId = product.id;
  const shareUrl = buildProductUrl(productId);

  dom.shareBtn.addEventListener("click", async () => {
    if (dom.shareStatus) dom.shareStatus.textContent = "";

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        if (dom.shareStatus)
          dom.shareStatus.textContent = "Link copied to clipboard!";
        return;
      }

      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "absolute";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        if (dom.shareStatus)
          dom.shareStatus.textContent = "Link copied to clipboard!";
        return;
      }

      const _ = window.prompt("Copy this link to share:", shareUrl);
      if (dom.shareStatus) dom.shareStatus.textContent = "Copy the link above!";
    } catch (error) {
      console.error("Could not copy link:", error);
      window.prompt("Copy this link to share:", shareUrl);
      if (dom.shareStatus) dom.shareStatus.textContent = "Copy the link above!";
    }
  });
}

/**
 * Main entry point for the product page.
 *
 * - Reads the product ID from the URL
 * - Fetches product details and all products
 * - Renders product, reviews, similar products
 * - Sets up Add to Cart and Share button functionality
 *
 * Immediately invoked when the script loads.
 *
 * @returns {Promisevoid}
 */
(async function startProductPage() {
  setPageState({ isLoading: true, isError: false });

  try {
    const id = getProductIdFromUrl();

    if (!id) {
      console.error("No product ID found in URL");
      return;
    }

    const [product, allProducts] = await Promise.all([
      getProductById(id),
      fetchAllProducts(),
    ]);

    console.log("🛍️ Loaded product:", product);

    renderProduct(product);
    renderReviews(product);
    setupAddToCart(product);
    setupShareLink(product);

    const similar = getSimilarProducts(product, allProducts, 4);
    renderSimilarProducts(similar);

    setPageState({ isLoading: false, isError: false });
  } catch (error) {
    console.error("❌ Could not load product:", error);

    if (dom.error) {
      dom.error.textContent = "Could not load product. Please try again later.";
    }
    setPageState({ isLoading: false, isError: true });
  }
  updateCartCount();
})();
