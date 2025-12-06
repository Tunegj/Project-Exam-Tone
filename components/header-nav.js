import { isLoggedIn, logout as clearAuth } from "../utils/auth.js";
import { clearUser } from "../utils/user-helpers.js";
import { clearCart } from "../utils/cart-helper.js";
import { updateCartCount } from "../utils/cart-ui.js";
import { initSearch } from "./search.js";
import { getProducts } from "../api/products.js";

/**
 * Category groups used to map raw tags into top-level categories.
 * Keys are group labels, values are arrays of tags that belong to that group.
 */
const CATEGORY_GROUPS = {
  Beauty: ["beauty", "skincare", "makeup", "fragrance"],
  Accessories: ["accessories", "jewelry", "watches", "bags"],
  Tech: ["electronics", "computers", "audio", "gaming"],
  Fashion: ["clothing", "shoes", "apparel", "footwear"],
};

/**
 * Handle full logout flow:
 * - Clear auth token
 * - Clear stored user info
 * - Clear shopping cart
 * - Update cart UI
 * - Redirect to login page
 */
function handleLogout() {
  clearAuth();
  clearUser();
  clearCart();

  updateCartCount();

  window.location.href = "./account/login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  initHeader().catch((err) => console.error("Error initializing header:", err));
});

/**
 * Wire the auth link (login / logout) based on current auth state.
 * @param {HTMLElement} root - The header root element (mount).
 */
function wireAuthLink(root) {
  const links = root.querySelector("[data-auth-link]");
  if (!links.length) return;

  const loggedIn = isLoggedIn();

  links.forEach((link) => {
    // Remove existing event listeners by cloning the node
    const cleanLink = link.cloneNode(true);
    link.replaceWith(cleanLink);

    if (loggedIn) {
      cleanLink.textContent = "Log out";
      cleanLink.href = "#";

      cleanLink.addEventListener("click", (e) => {
        e.preventDefault();
        handleLogout();
      });
    } else {
      cleanLink.textContent = "Log in / Register";
      cleanLink.href = "./account/login.html";
    }
  });
}

/**
 * Initialize the header navigation:
 * - Injects HTML partial
 * - Loads categories and renders dropdowns
 * - Wires up mobile menu and category toggles
 * - Wires auth link
 * - Initializes search
 * - Updates cart count
 */
async function initHeader() {
  const mount = document.getElementById("site-header");
  if (!mount) return;

  // 1) Inject the partial first
  const res = await fetch("../partials/header-nav.html");
  if (!res.ok) throw new Error("Failed to load header partial");

  mount.innerHTML = await res.text();

  // 2) Load categories from products and map to gruops
  const tags = await loadCategories();
  const groups = mapTagsToGroups(tags);

  // 3) Wire behaviour + render dropdowns
  wireHeader(mount);
  renderDesktopDropdown(mount, groups);
  renderMobileDropdown(mount, groups);
  wireCategoryToggles(mount);

  // 4) Auth UI + search
  wireAuthLink(mount);
  initSearch(mount);

  // 5) Update cart count
  updateCartCount();
}

/**
 * Load all unique tags from products via the API
 * @returns {Promise<string[]>} Unique, lowercased tags.
 */
async function loadCategories() {
  try {
    const products = await getProducts();
    if (!Array.isArray(products)) return [];

    const allTags = products.flatMap((p) => p.tags ?? []);
    const uniqueTags = [...new Set(allTags.map((t) => t.toLowerCase()))];

    return uniqueTags;
  } catch (error) {
    console.error("Failed to load categories:", error);
    return [];
  }
}

/**
 * Map raw tags into named groups defined in CATEGORY_GROUPS
 * Any tag that does not match a group is placed under "Other".
 * @param {string[]} tags - Array of tag strings.
 * @returns {Record<string, string[]>} Object with group name keys.
 */
function mapTagsToGroups(tags) {
  const result = {};
  const assigned = new Set();

  for (const [groupName, groupTags] of Object.entries(CATEGORY_GROUPS)) {
    const found = tags.filter((t) => groupTags.includes(t.toLowerCase()));
    if (found.length > 0) {
      result[groupName] = found;
      found.forEach((t) => assigned.add(t.toLowerCase()));
    }
  }

  const leftover = tags.filter((t) => !assigned.has(t.toLowerCase()));
  if (leftover.length > 0) {
    result.Other = leftover;
  }

  return result;
}

/**
 * Build the HTML for category list items.
 * @param {Record<string, string[]>} groups
 * @param {string} itemClass - Class name for each <li>
 * @returns {string} HTML string
 */
function buildCategoryListHtml(groups, itemClass) {
  return Object.keys(groups)
    .map(
      (group) => `<li class="${itemClass}">
          <a href="/products-page.html?group=${encodeURIComponent(
            group.toLowerCase()
          )}">
            ${group}
          </a>
        </li>`
    )
    .join("");
}

/**
 * Render the desktop category dropdown
 * @param {HTMLElement} root
 * @param {Record<string, string[]>} groups
 */
function renderDesktopDropdown(root, groups) {
  const list = root.querySelector("[data-cat-list]");
  if (!list) return;

  list.innerHTML = buildCategoryListHtml(groups, "cat-group");
}

/**
 * Render the mobile category dropdown
 * @param {HTMLElement} root
 * @param {Record<string, string[]>} groups
 */
function renderMobileDropdown(root, groups) {
  const mobileList = root.querySelector("[data-mobile-cat-list]");
  if (!mobileList) return;

  mobileList.innerHTML = buildCategoryListHtml(groups, "mobile-cat-group");
  mobileList.hidden = true;
}

/**
 * Wire the mobile header behaviour:
 * - Hamburger menu open/close
 * - Escape key to close
 * - Focus management
 * @param {HTMLElement} root
 */
function wireHeader(root) {
  const panel = document.getElementById("mobile-nav");
  const burger = root.querySelector(".hamburger");
  const closeBtn = root.querySelector(".close");
  const firstLink = panel?.querySelector(".nav-links a");

  if (!panel || !burger) return;

  burger.setAttribute("aria-controls", panel.id);
  burger.setAttribute("aria-expanded", "false");
  panel.setAttribute("aria-hidden", "true");

  function openMenu() {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    burger.setAttribute("aria-expanded", "true");
    document.body.classList.add("body-lock");

    const focusTarget = firstLink || closeBtn;
    if (focusTarget) {
      focusTarget.focus();
    }
  }

  function closeMenu() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("body-lock");
    burger.focus();
  }

  burger.addEventListener("click", () => {
    if (panel.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  closeBtn?.addEventListener("click", closeMenu);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("open")) {
      closeMenu();
    }
  });
}

/**
 * Wire category dropdown toggles for desktop and mobile
 * @param {HTMLElement} root
 */
function wireCategoryToggles(root) {
  const trigger = root.querySelector("[data-cat-trigger]");
  const panel = root.querySelector("[data-cat-panel]");

  if (trigger && panel) {
    if (!panel.id) {
      panel.id = "header-cat-panel";
    }

    trigger.setAttribute("aria-haspopup", "true");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", panel.id);

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
    if (!mobileList.id) {
      mobileList.id = "mobile-cat-list";
    }
    mobileToggle.setAttribute("aria-controls", mobileList.id);
    mobileToggle.setAttribute("aria-expanded", "false");

    mobileToggle.addEventListener("click", () => {
      const isHidden = mobileList.hidden;
      mobileList.hidden = !isHidden;
      mobileToggle.setAttribute("aria-expanded", String(!isHidden));
    });
  }
}
