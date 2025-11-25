import { finalPrice, isOnSale, money } from "../utils/price-helpers.js";
import { getProducts } from "./api/products.js";
import { cardHTML, slideHTML } from "../components/product-card.js";
import { addToCart, loadCart } from "../utils/cart-helper.js";
import { updateCartCount } from "../utils/cart-ui.js";

// DOM elements
const dom = {
  carousel: document.querySelector("[data-carousel]"),
  grid: document.querySelector("[data-grid]"),
  prev: document.querySelector("[data-prev]"),
  next: document.querySelector("[data-next]"),
  dots: document.querySelector("[data-dots]"),
  track: null,
};

// state for slider
const slider = {
  index: 0,
  total: 0,
};

let currentSlideIndex = 0;
let totalSlides = 0;

let productsCache = [];

function jumpToSlide(trackIndex) {
  dom.track.style.transition = "none";
  dom.track.style.transform = `translateX(-${trackIndex * 100}%)`;
}

function animateToSlide(trackIndex) {
  dom.track.style.transition = "transform 0.35s ease";
  dom.track.style.transform = `translateX(-${trackIndex * 100}%)`;
}

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

// highlight the active dot based on logical slide index
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

let autoPlayTimer = null;
const AUTO_PLAY_INTERVAL = 4000;

// auto-play functions
function startAutoPlay() {
  stopAutoPlay();

  autoPlayTimer = setInterval(() => {
    dom.next.click();
  }, AUTO_PLAY_INTERVAL);
}

// stop auto-play
function stopAutoPlay() {
  if (autoPlayTimer !== null) {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
  }

  //   clear timer and restart auto-play after a delay
  clearTimeout(stopAutoPlay.restartTimer);
  stopAutoPlay.restartTimer = setTimeout(() => {
    startAutoPlay();
  }, AUTO_PLAY_INTERVAL);
}

// Swipe
let startX = 0;
let currentX = 0;
let isSwiping = false;
const SWIPE_THRESHOLD = 50;

// touch event handlers
function onTouchStart(event) {
  stopAutoPlay(); //pause auto-play on touch

  startX = event.touches[0].clientX;
  currentX = startX;
  isSwiping = true;

  dom.track.style.transition = "none";
}

function onTouchMove(event) {
  if (!isSwiping) return;

  currentX = event.touches[0].clientX;
  const deltaX = currentX - startX;

  const percent =
    -currentSlideIndex * 100 + (deltaX / dom.carousel.offsetWidth) * 100;

  dom.track.style.transform = `translateX(${percent}%)`;
}

// Swipe left - next, Swipe right - prev
function onTouchEnd() {
  if (!isSwiping) return;
  isSwiping = false;

  const deltaX = currentX - startX;

  if (deltaX < -SWIPE_THRESHOLD) {
    dom.next.click();
  } else if (deltaX > SWIPE_THRESHOLD) {
    dom.prev.click();
  } else {
    animateToSlide(currentSlideIndex);
  }

  setTimeout(startAutoPlay, 4000);
}

// main entry point
(async function start() {
  try {
    const products = await getProducts();

    productsCache = products;

    const latest3 = products.slice(-3);
    const latest12 = products.slice(-12);

    const slides = latest3.reverse();
    const gridItems = latest12.reverse();

    console.log("Latest 3 products for slider:", slides);
    console.log("Latest 12 products for grid:", gridItems);
    console.log("🧪 slide HTML (first of 3):", slideHTML(slides[0], 0));
    console.log("🧪 card HTML (first of 12):", cardHTML(gridItems[0]));

    // --- generate slides with infinite loop ---
    if (dom.carousel) {
      const track = document.createElement("div");
      track.className = "carousel__track";

      const first = slides[0];
      const last = slides[slides.length - 1];

      track.innerHTML =
        slideHTML(last, -1) +
        slides.map((p, i) => slideHTML(p, i)).join("") +
        slideHTML(first, slides.length);

      dom.carousel.innerHTML = "";
      dom.carousel.appendChild(track);

      dom.track = track;
    }

    totalSlides = slides.length;
    currentSlideIndex = 0;

    // --- generate dots for each real slide ---
    if (dom.dots) {
      dom.dots.innerHTML = slides
        .map(
          (_product, i) => `
            <button type="button" class="dot" data-index="${i}" aria-label="Go to slide ${
            i + 1
          }"></button>`
        )
        .join("");
    }

    // --- make dots clickable ---
    if (dom.dots) {
      dom.dots.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-index]");
        if (!btn) return;

        const targetLogical = Number(btn.dataset.index);

        currentSlideIndex = targetLogical + 1; // adjust for clone
        animateToSlide(currentSlideIndex);
        updateDots(targetLogical);
      });
    }

    jumpToSlide(1);
    updateDots(0);
    startAutoPlay();

    // --- add event listeners to prev/next buttons ---
    dom.next.addEventListener("click", () => {
      currentSlideIndex++;

      // If we slid into the clone FIRST
      if (currentSlideIndex === totalSlides + 1) {
        // animate into clone
        animateToSlide(currentSlideIndex);

        // AFTER animation ends, jump to real slide 0 instantly
        dom.track.addEventListener(
          "transitionend",
          () => {
            currentSlideIndex = 1; // real first slide
            jumpToSlide(1);
            updateDots(getLogicalIndex());
          },
          { once: true }
        );
      } else {
        animateToSlide(currentSlideIndex);
        updateDots(getLogicalIndex());
      }
    });

    dom.prev.addEventListener("click", () => {
      currentSlideIndex--;

      // If we slid into the clone LAST
      if (currentSlideIndex === 0) {
        animateToSlide(0); // animate to clone last

        dom.track.addEventListener(
          "transitionend",
          () => {
            currentSlideIndex = totalSlides; // real last slide
            jumpToSlide(totalSlides);
            updateDots(getLogicalIndex());
          },
          { once: true }
        );
      } else {
        animateToSlide(currentSlideIndex);
        updateDots(getLogicalIndex());
      }
    });

    slider.total = slides.length;
    slider.index = 0;

    console.log("slider total:", slider.total, "current index:", slider.index);

    // --- product grid: insert 12 cards ---
    if (dom.grid) {
      dom.grid.innerHTML = gridItems
        .map((product) => cardHTML(product))
        .join("");
    }

    initCarouselAddToCart();
    updateCartCount(loadCart());
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

function wrapSliderIndex() {
  if (slider.total <= 0) return;

  slider.index = ((slider.index % slider.total) + slider.total) % slider.total;
}

function findProductById(id) {
  if (!id || !productsCache) return null;
  return productsCache.find((p) => p.id === id);
}

function initCarouselAddToCart() {
  if (!dom.carousel) return;

  dom.carousel.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-to-cart]");
    if (!button) return;

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
      addToCart(product, 1);
      updateCartCount(loadCart());

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
