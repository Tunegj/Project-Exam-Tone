const API_URL = "https://v2.api.noroff.dev/online-shop";

export async function getProducts() {
  const res = await fetch(API_URL);

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return json.data || [];
}

export async function getProductById(id) {
  const res = await fetch(`${API_URL}/${encodeURIComponent(id)}`);

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return json.data;
}

export { API_URL };
