const panel = document.getElementById("mobile-nav");
const burger = document.querySelector(".hamburger");
const closeBtn = panel.querySelector(".close");
const firstLink = panel.querySelector(".nav-links a");

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
  burger.focus();
}

burger.addEventListener("click", () =>
  panel.classList.contains("open") ? closeMenu() : openMenu()
);
closeBtn.addEventListener("click", closeMenu);

panel.addEventListener("click", (e) => {
  if (e.target === panel) closeMenu(); // click outside content area (if you add a backdrop)
});
panel
  .querySelectorAll("a")
  .forEach((a) => a.addEventListener("click", closeMenu));

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && panel.classList.contains("open")) closeMenu();
});

document.addEventListener("DOMContentLoaded", async () => {
  const mount = document.getElementById("site-header");
  if (!mount) return;

  try {
    // root-relative so it works on /index.html, /product.html, etc.
    const res = await fetch("/partials/header-nav.html");
    if (!res.ok) throw new Error(`Failed to load header: ${res.status}`);
    mount.innerHTML = await res.text();

    // if you have any header init code (hamburger, accordion, etc.), call it here
    // initHeaderNav?.();
  } catch (err) {
    console.error(err);
  }
});
