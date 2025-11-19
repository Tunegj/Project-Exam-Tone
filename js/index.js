const API_URL = "https://v2.api.noroff.dev/online-shop";

// DOM elements
const dom = {
  carousel: document.querySelector("[data-carousel]"),
  productGrid: document.querySelector("[data-grid]"),
  prev: document.querySelector("[data-prev]"),
  next: document.querySelector("[data-next]"),
  dots: document.querySelector("[data-dots]"),
};

// state for slider
const slider = {
  index: 0,
  total: 0,
};

// helper to fetch and return product array
async function getProducts() {
  // make http request
  const res = await fetch(API_URL);

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  // parse json
  const json = await res.json();
  return json.data || []; // return the products array
}

// example usage
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
      dom.carousel.innerHTML = slides
        .map((product, index) => slideHTML(product, index))
        .join("");
    }

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

    setupSliderControls();
  }
})();

function setupSliderControls() {
  if (dom.prev) {
    dom.prev.addEventListener("click", () => {
      slider.index -= 1;
      wrapSliderIndex();
      console.log("current slider index:", slider.index);
    });
  }
}

if (dom.next) {
  dom.next.addEventListener("click", () => {
    slider.index += 1;
    wrapSliderIndex();
    console.log("current slider index:", slider.index);
  });
}

function wrapSliderIndex() {
  if (slider.total <= 0) return;

  slider.index = ((slider.index % slider.total) + slider.total) % slider.total;
}

// price helpers

function finalPrice(p) {
  return p?.discountedPrice ?? p?.price ?? 0;
}

function isOnSale(p) {
  const price = p?.price ?? 0;
  const discounted = p?.discountedPrice ?? price;
  return discounted < price;
}

// format number as currency string
function money(n) {
  const v = Number(n || 0);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(v);
  } catch {
    return `$${v.toFixed(2)}`;
  }
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
