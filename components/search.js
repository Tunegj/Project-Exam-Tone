export function initSearch(root = document) {
  const forms = root.querySelectorAll("[data-search-form]");
  if (!forms.length) {
    console.warn("initSearch: no search forms found");
    return;
  }

  forms.forEach((form) => {
    const input = form.querySelector("[data-search-input]");
    if (!input) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const query = input.value.trim();
      if (!query) return;

      const url = new URL("/products.html", window.location.origin);
      url.searchParams.set("search", query);
      window.location.href = url.toString();
    });
  });
}
