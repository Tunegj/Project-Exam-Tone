import { getProducts } from "../api/products.js";
import { cardHTML, slideHTML } from "../components/product-card.js";
import { addToCart } from "../utils/cart-helper.js";
import { updateCartCount } from "../utils/cart-ui.js";
import { isLoggedIn } from "../utils/auth.js";

/**
 * DOM references for the home page
 */
const dom = {
  carousel: document.querySelector("[data-carousel]"),
  grid: document.querySelector("[data-grid]"),
  prev: document.querySelector("[data-prev]"),
  next: document.querySelector("[data-next]"),
  dots: document.querySelector("[data-dots]"),
  track: null,
};

// state for slider
let currentSlideIndex = 0;
let totalSlides = 0;

let autoPlayTimer = null;
const AUTO_PLAY_INTERVAL = 4000;

// Swipe
let startX = 0;
let currentX = 0;
let isSwiping = false;
const SWIPE_THRESHOLD = 50;

let productsCache = [];

/**
 * Jump to a slide immediately without animation
 * @param {number} trackIndex
 */
function jumpToSlide(trackIndex) {
  if (!dom.track) return;
  dom.track.style.transition = "none";
  dom.track.style.transform = `translateX(-${trackIndex * 100}%)`;
}

/**
 * Animate to a slide index.
 * @param {number} trackIndex
 */
function animateToSlide(trackIndex) {
  if (!dom.track) return;
  dom.track.style.transition = "transform 0.35s ease";
  dom.track.style.transform = `translateX(-${trackIndex * 100}%)`;
}

/**
 * Convert the current slide index into a logical index (0 to totalSlides-1),
 * ignoring the cloned slides.
 * @returns {number}
 */
function getLogicalIndex() {
  if (totalSlides === 0) return 0;

  if (currentSlideIndex === 0) {
    return totalSlides - 1;
  }
  if (currentSlideIndex === totalSlides + 1) {
    return 0;
  }
  return currentSlideIndex - 1;
}

/**
 * Highlight the active dot based on the logical slide index.
 * @param {number} logicalIndex
 */
function updateDots(logicalIndex) {
  if (!dom.dots) return;

  const buttons = dom.dots.querySelectorAll("[data-index]");
  buttons.forEach((btn) => {
    const idx = Number(btn.dataset.index);
    const isActive = idx === logicalIndex;

    btn.classList.toggle("dot--active", isActive);
    btn.setAttribute("aria-current", isActive ? "true" : "false");
  });
}

/**
 * Go to the next slide, handling infinite loop logic.
 */
function goToNextSlide() {
  if (!dom.track || totalSlides === 0) return;

  currentSlideIndex++;

  if (currentSlideIndex === totalSlides + 1) {
    animateToSlide(currentSlideIndex);

    dom.track.addEventListener(
      "transitionend",
      () => {
        currentSlideIndex = 1;
        jumpToSlide(1);
        updateDots(getLogicalIndex());
      },
      { once: true }
    );
  } else {
    animateToSlide(currentSlideIndex);
    updateDots(getLogicalIndex());
  }
}

/**
 * Go to the previous slide, handling infinite loop logic.
 */
function goToPrevSlide() {
  if (!dom.track || totalSlides === 0) return;

  currentSlideIndex--;

  if (currentSlideIndex === 0) {
    animateToSlide(0);

    dom.track.addEventListener(
      "transitionend",
      () => {
        currentSlideIndex = totalSlides;
        jumpToSlide(totalSlides);
        updateDots(getLogicalIndex());
      },
      { once: true }
    );
  } else {
    animateToSlide(currentSlideIndex);
    updateDots(getLogicalIndex());
  }
}

/**
 * Start the auto-play timer.
 */
function startAutoPlay() {
  if (!dom.carousel || !dom.next) return;

  if (autoPlayTimer !== null) {
    clearInterval(autoPlayTimer);
  }

  autoPlayTimer = setInterval(() => {
    goToNextSlide();
  }, AUTO_PLAY_INTERVAL);
}

/**
 * Stop the auto-play timer.
 */
function stopAutoPlay() {
  if (autoPlayTimer !== null) {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
  }
}

/**
 * Touch start handler for swipe gestures.
 * @param {TouchEvent} event
 */
function onTouchStart(event) {
  stopAutoPlay(); //pause auto-play on touch

  startX = event.touches[0].clientX;
  currentX = startX;
  isSwiping = true;

  if (!dom.track) {
    dom.track.style.transition = "none";
  }
}

/**
 * Touch move handler for swipe gestures.
 * @param {TouchEvent} event
 */
function onTouchMove(event) {
  if (!isSwiping || !dom.carousel || !dom.track) return;

  currentX = event.touches[0].clientX;
  const deltaX = currentX - startX;

  const percent =
    -currentSlideIndex * 100 + (deltaX / dom.carousel.offsetWidth) * 100;

  dom.track.style.transform = `translateX(${percent}%)`;
}

/**
 * Touch end handler for swipe gestures.
 * @returns
 */
function onTouchEnd() {
  if (!isSwiping) return;
  isSwiping = false;

  const deltaX = currentX - startX;

  if (deltaX < -SWIPE_THRESHOLD) {
    dom.next?.click();
  } else if (deltaX > SWIPE_THRESHOLD) {
    dom.prev?.click();
  } else {
    animateToSlide(currentSlideIndex);
  }

  setTimeout(startAutoPlay, AUTO_PLAY_INTERVAL);
}

/**
 * Find a product by its ID from the cached products.
 * @param {string} id
 * @returns {Object|null}
 */
function findProductById(id) {
  if (!id || !productsCache) return null;
  return productsCache.find((p) => p.id === id) || null;
}

/**
 * Initialize the "Add to Cart" buttons in the carousel.
 * - If the user is not logged in, buttons prompt to log in.
 * - If logged in, buttons add the product to the cart.
 */
function initCarouselAddToCart() {
  if (!dom.carousel) return;

  const loggedIn = isLoggedIn();
  const buttons = dom.carousel.querySelectorAll("[data-add-to-cart]");

  buttons.forEach((btn) => {
    btn.textContent = loggedIn ? "Add to Cart" : "Log in to shop";
  });

  dom.carousel.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-to-cart]");
    if (!button) return;

    if (!isLoggedIn()) {
      window.location.href = "./account/login.html";
      return;
    }

    const productId = button.dataset.productId;
    if (!productId) return;

    const product = findProductById(productId);
    if (!product) {
      console.error("Could not find product with ID:", productId);
      return;
    }

    button.disabled = true;
    const originalLabel = button.textContent;
    button.textContent = "Adding...";

    try {
      addToCart(product);
      updateCartCount();

      button.textContent = "Added!";
      setTimeout(() => {
        button.disabled = false;
        button.textContent = originalLabel;
      }, 1000);
    } catch (error) {
      console.error("Could not add to cart:", error);
      button.textContent = "Error";
      setTimeout(() => {
        button.disabled = false;
        button.textContent = originalLabel;
      }, 1000);
    }
  });
}

/**
 * Render slides for the carousel with inifinite looping.
 * @param {Array<Object>} slides
 */
function renderCarousel(slides) {
  if (!dom.carousel || slides.length === 0) return;

  const track = document.createElement("div");
  track.className = "carousel__track";

  const total = slides.length;
  const first = slides[0];
  const last = slides[slides.length - 1];

  track.innerHTML =
    slideHTML(last, total - 1, total) +
    slides.map((p, i) => slideHTML(p, i, total)).join("") +
    slideHTML(first, 0, total);

  const firstElement = dom.carousel.firstElementChild;
  dom.carousel.insertBefore(track, firstElement);

  dom.track = track;

  totalSlides = total;
  currentSlideIndex = 1;

  jumpToSlide(1);
  updateDots(0);
}

/**
 * Render dots for the carousel.
 * @param {number} total
 */
function renderDots(total) {
  if (!dom.dots || total === 0) return;

  dom.dots.innerHTML = Array.from({ length: total })
    .map(
      (_unused, i) => `
      <button type="button" class="dot ${i === 0 ? "dot--active" : ""}"
      data-index="${i}" aria-label="Go to slide ${i + 1}" aria-current="${
        i === 0 ? "true" : "false"
      }"
      ></button>`
    )
    .join("");
  dom.dots.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-index]");
    if (!btn) return;

    const targetLogical = Number(btn.dataset.index);

    currentSlideIndex = targetLogical + 1;
    animateToSlide(currentSlideIndex);
    updateDots(targetLogical);
  });
}

/**
 * Render product grid cards.
 * @param {Array<Object>} products
 */
function renderGrid(products) {
  if (!dom.grid) return;
  dom.grid.innerHTML = products.map((product) => cardHTML(product)).join("");
}

/**
 * Main entry point for the home page.
 * - Loads products from the API
 * - Prepares the latest 3 products for the carousel
 * - Prepares the latest 12 products for the product grid
 * - Wires slider controls and auto-play
 * - Wires add to cart button behavior for carousel button
 */
(async function start() {
  try {
    const products = await getProducts();
    productsCache = products;

    const latest3 = products.slice(-3);
    const latest12 = products.slice(-12);

    const slides = latest3.reverse();
    const gridItems = latest12.reverse();

    // --- generate slides with infinite loop ---
    if (dom.carousel) {
      renderDots(slides.length);
      renderCarousel(slides);

      dom.next.addEventListener("click", () => {
        stopAutoPlay();
        goToNextSlide();
      });

      dom.prev.addEventListener("click", () => {
        stopAutoPlay();
        goToPrevSlide();
      });

      startAutoPlay();
    }

    if (dom.grid) {
      renderGrid(gridItems);
    }

    initCarouselAddToCart();
    updateCartCount();
  } catch (error) {
    console.error("could not organize products:", error);

    if (dom.carousel) {
      dom.carousel.innerHTML = `<p role="alert">Could not load banner products.</p>`;
    }

    if (dom.grid) {
      dom.grid.innerHTML = `<p role="alert">Could not load product grid.</p>`;
    }
  }
})();

// pause auto-play on hover/touch
if (dom.carousel) {
  dom.carousel.addEventListener("mouseenter", stopAutoPlay);
  dom.carousel.addEventListener("mouseleave", startAutoPlay);
}

// pause auto-play on touch devices
if (dom.carousel) {
  dom.carousel.addEventListener("touchstart", stopAutoPlay, { passive: true });
  dom.carousel.addEventListener("touchend", startAutoPlay, { passive: true });
}

if (dom.carousel) {
  dom.carousel.addEventListener("touchstart", onTouchStart, { passive: true });
  dom.carousel.addEventListener("touchmove", onTouchMove, { passive: true });
  dom.carousel.addEventListener("touchend", onTouchEnd, { passive: true });
}
