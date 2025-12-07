const BASE_PATH = "/Project-Exam-Tone";

/**
 * Builds the URL for the products page with a search query.
 * Ensures it works correctly on GitHub Pages by including the repo base path.
 *
 * @param {string} query - The search text from the input field.
 * @returns {string} A fully qualified URL to navigate to.
 */
function buildSearchUrl(query) {
  const url = new URL(
    `${BASE_PATH}/products-page.html`,
    window.location.origin
  );
  url.searchParams.set("search", query);
  return url.toString();
}

/**
 * Initializes search functionality for all forms with [data-search-form].
 * Submitting a search redirects to the products page with ?search=<query>.
 *
 * @param {Document|HTMLElement} [root=document] - Optional root to scope the querySelectorAll (e.g. a header nav).
 */
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

      const target = buildSearchUrl(query);
      window.location.href = target;
    });
  });
}
