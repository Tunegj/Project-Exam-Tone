const API_URL = "https://v2.api.noroff.dev/online-shop";

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
  } catch (error) {
    console.error("could not organize products:", error);
  }
})();

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
