const API_URL = "https://v2.api.noroff.dev/online-shop";

import { finalPrice, isOnSale, money } from "../utils/price-helpers.js";
import { getProducts } from "../api/products.js";

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

function jumpToSlide(trackIndex) {
  dom.track.style.transition = "none";
  dom.track.style.transform = `translateX(-${trackIndex * 100}%)`;
}

function animateToSlide(trackIndex) {
  dom.track.style.transition = "transform 0.35s ease";
  dom.track.style.transform = `translateX(-${trackIndex * 100}%)`;
}

// update dots to reflect current slide
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

  //   restart auto-play after a delay
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

    const latest3 = products.slice(-3);
    const latest12 = products.slice(-12);

    const slides = latest3.reverse();
    const gridItems = latest12.reverse();

    console.log("Latest 3 products for slider:", slides);
    console.log("Latest 12 products for grid:", gridItems);
    console.log("🧪 slide HTML (first of 3):", slideHTML(slides[0], 0));
    console.log("🧪 card HTML (first of 12):", cardHTML(gridItems[0]));

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

    // --- generate dots ---
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

    // --- dots clickable ---
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

function esc(text) {
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
function productLink(p) {
  // consistent product detail link
  return `/product.html?id=${encodeURIComponent(p?.id ?? "")}`;
}

// image helpers
function imageUrl(p) {
  return p?.image?.url || "https://via.placeholder.com/800x500?text=No+image";
}

// alt text helper
function imageAlt(p) {
  return p?.image?.alt || p?.title || "Product image";
}

// generate HTML snippets
function slideHTML(p, index = 0) {
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

        <a class="product-button" href="${productLink(p)}">View Product</a>
    </div>
    </article>
    `;
}

// product card for grid
function cardHTML(p) {
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
