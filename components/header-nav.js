import { isLoggedIn } from "../utils/auth.js";
import { loadCart } from "../utils/cart-helper.js";
import { updateCartCount } from "../utils/cart-ui.js";
import { initSearch } from "./search.js";

const CATEGORY_GROUPS = {
  Beauty: ["beauty", "skincare", "makeup", "fragrance"],
  Accessories: ["accessories", "jewelry", "watches", "bags"],
  Tech: ["electronics", "computers", "audio", "gaming"],
  Fashion: ["clothing", "shoes", "apparel", "footwear"],
};

document.addEventListener("DOMContentLoaded", () => {
  initHeader().catch((err) => console.error("Error initializing header:", err));
});

async function initHeader() {
  const mount = document.getElementById("site-header");
  if (!mount) return;

  // 1) Inject the partial first
  const res = await fetch("/partials/header-nav.html");
  if (!res.ok) throw new Error("Failed to load header partial");

  mount.innerHTML = await res.text();

  const tags = await loadCategories();
  const groups = mapTagsToGroups(tags);

  wireHeader(mount);
  renderDesktopDropdown(mount, groups);
  renderMobileDropdown(mount, groups);
  wireCategoryToggles(mount);

  initSearch(mount);

  const cart = loadCart();
  updateCartCount(cart);
}

async function loadCategories() {
  try {
    const res = await fetch("https://v2.api.noroff.dev/online-shop");
    if (!res.ok) throw new Error("Failed to fetch products");

    const json = await res.json();
    const products = json.data;
    if (!Array.isArray(products)) return [];

    const allTags = products.flatMap((p) => p.tags ?? []);

    const uniqueTags = [...new Set(allTags.map((t) => t.toLowerCase()))];

    return uniqueTags;
  } catch (error) {
    console.error("Error loading categories:", error);
    return [];
  }
}

function mapTagsToGroups(tags) {
  const result = {};

  for (const [groupName, groupTags] of Object.entries(CATEGORY_GROUPS)) {
    const found = tags.filter((t) => groupTags.includes(t.toLowerCase()));
    if (found.length > 0) result[groupName] = found;
  }
  return result;
}

function renderDesktopDropdown(root, groups) {
  const list = root.querySelector("[data-cat-list]");
  if (!list) return;

  list.innerHTML = Object.keys(groups)
    .map(
      (group) => `
        <li class="cat-group">
          <a href="/products.html?group=${encodeURIComponent(
            group.toLowerCase()
          )}">
            ${group}
          </a>
        </li>`
    )
    .join("");
}

function renderMobileDropdown(root, groups) {
  const mobileList = root.querySelector("[data-mobile-cat-list]");
  if (!mobileList) return;

  mobileList.innerHTML = Object.keys(groups)
    .map(
      (group) => `
        <li class="mobile-cat-group">
          <a href="/products.html?group=${encodeURIComponent(
            group.toLowerCase()
          )}">
            ${group}
          </a>
        </li>`
    )
    .join("");

  mobileList.hidden = false;
}

function wireHeader(root) {
  const panel = document.getElementById("mobile-nav");
  const burger = root.querySelector(".hamburger");
  const closeBtn = root.querySelector(".close");
  const firstLink = panel?.querySelector(".nav-links a");

  if (!panel || !burger) return;

  function openMenu() {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    burger.setAttribute("aria-expanded", "true");
    document.body.classList.add("body-lock");
    (firstLink ?? closeBtn).focus();
  }

  function closeMenu() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("body-lock");
  }

  burger.addEventListener("click", () =>
    panel.classList.contains("open") ? closeMenu() : openMenu()
  );
  closeBtn?.addEventListener("click", closeMenu);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("open")) closeMenu();
  });
}

function wireCategoryToggles(root) {
  const trigger = root.querySelector("[data-cat-trigger]");
  const panel = root.querySelector("[data-cat-panel]");

  if (trigger && panel) {
    trigger.setAttribute("aria-haspopup", "true");
    trigger.setAttribute("aria-expanded", "false");

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = panel.classList.contains("open");
      panel.classList.toggle("open", !isOpen);
      trigger.setAttribute("aria-expanded", String(!isOpen));
    });

    document.addEventListener("click", (e) => {
      if (!panel.contains(e.target) && e.target !== trigger) {
        panel.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      }
    });
  }

  const mobileToggle = root.querySelector(".submenu-toggle");
  const mobileList = root.querySelector("[data-mobile-cat-list]");

  if (mobileToggle && mobileList) {
    mobileToggle.addEventListener("click", () => {
      const isHidden = mobileList.hidden;
      mobileList.hidden = !isHidden;
      mobileToggle.setAttribute("aria-expanded", String(!isHidden));
    });
  }
}
