document.addEventListener("DOMContentLoaded", initHeader);

async function initHeader() {
  const mount = document.getElementById("site-header");
  if (!mount) return; // page has no header

  // 1) Inject the partial first
  const res = await fetch("/partials/header-nav.html");
  if (!res.ok) {
    console.error("Header load failed:", res.status);
    return;
  }
  mount.innerHTML = await res.text();

  // 2) Now that the HTML exists, wire up behavior
  wireHeader(mount);
}

function wireHeader(root) {
  // query *inside* the injected header
  const panel = document.getElementById("mobile-nav"); // if it's outside header
  const burger = root.querySelector(".hamburger");
  const closeBtn = root.querySelector(".close");
  const firstlnk = panel?.querySelector(".nav-links a");

  if (!panel || !burger) return; // graceful if markup changes

  function openMenu() {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    burger.setAttribute("aria-expanded", "true");
    document.body.classList.add("body-lock");
    (firstlnk ?? closeBtn)?.focus();
  }

  function closeMenu() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("body-lock");
    burger.focus();
  }

  burger.addEventListener("click", () => {
    panel.classList.contains("open") ? closeMenu() : openMenu();
  });
  closeBtn?.addEventListener("click", closeMenu);
  window.addEventListener(
    "keydown",
    (e) => e.key === "Escape" && panel.classList.contains("open") && closeMenu()
  );
}
