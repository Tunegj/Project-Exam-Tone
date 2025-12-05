const API_URL = "https://v2.api.noroff.dev/online-shop";

/**
 * Internal helper to fetch products from the API
 * @param {string} url
 * @returns {Promise<any>}
 * @throws {Error} when response is not ok
 */
async function requestJson(url) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Fetch all products from the API
 * @returns {Promise<Array>} products
 */
export async function getProducts() {
  const json = await requestJson(API_URL);
  return json.data || [];
}

/**
 * Fetch a single product by its ID
 * @param {string} id
 * @returns {Promise<Object>} product
 */
export async function getProductById(id) {
  const url = `${API_URL}/${encodeURIComponent(id)}`;
  const json = await requestJson(url);
  return json.data;
}

export { API_URL };
