const PRODUCT_API_URL = "https://v2.api.noroff.dev/online-shop";

import { finalPrice, isOnSale, money } from "../utils/price-helpers.js";
import { getProductById } from "./api/products.js";
import { cardHTML } from "../components/product-card.js";
import { addToCart, loadCart } from "../utils/cart-helper.js";
import { updateCartCount } from "../utils/cart-ui.js";
import { isLoggedIn } from "../utils/auth.js";

const dom = {
  image: document.querySelector("[data-product-image]"),
  title: document.querySelector("[data-product-title]"),
  description: document.querySelector("[data-product-description]"),
  price: document.querySelector("[data-product-price]"),
  oldPrice: document.querySelector("[data-product-old-price]"),
  rating: document.querySelector("[data-product-rating]"),
  addToCartBtn: document.querySelector("[data-add-to-cart]"),
  similarList: document.querySelector("[data-similar-list]"),
  similarEmpty: document.querySelector("[data-similar-empty]"),
  reviewsList: document.querySelector("[data-reviews-list]"),
  reviewsEmpty: document.querySelector("[data-reviews-empty]"),
  root: document.querySelector("[data-product-root]"),
};

function renderStars(value) {
  const rating = Number(value) || 0;
  const max = 5;
  let html = "";

  for (let i = 1; i <= max; i++) {
    html += `<span aria-hidden="true">${i <= rating ? "★" : "☆"}</span>`;
  }

  return html;
}

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
          <p class="review__rating" arial-label="Rated ${rating} out of 5">
            ${renderStars(rating)}
          </p>
      </article>`;
    })
    .join("");
}

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
    dom.addToCartBtn.textContent = "Add to cart";
    dom.addToCartBtn.disabled = false;
  }
}

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  return id ? id.trim() : null;
}

async function fetchAllProducts() {
  const res = await fetch(PRODUCT_API_URL);

  if (!res.ok) {
    throw new Error(`API error ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  return json.data || [];
}

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

function setupAddToCart(product) {
  if (!dom.addToCartBtn) return;

  dom.addToCartBtn.addEventListener("click", () => {
    addToCart(product);
    updateCartCount();
    alert(`Added "${product.title}" to your cart`);
  });
}

(async function startProductPage() {
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

    const similar = getSimilarProducts(product, allProducts, 4);
    renderSimilarProducts(similar);
  } catch (error) {
    console.error("❌ Could not load product:", error);
  }
  updateCartCount();
})();
