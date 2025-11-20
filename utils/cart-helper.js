const CART_KEY = "mirae-cart";

export function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse cart", error);
    return [];
  }
}

export function saveCart(cart) {
  const json = JSON.stringify(cart);
  localStorage.setItem(CART_KEY, json);
}

export function addToCart(product) {
  const cart = loadCart();

  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      discountedPrice: product.discountedPrice,
      image: product.image,
      quantity: 1,
    });
  }

  saveCart(cart);
}

export function getCartCount() {
  const cart = loadCart();

  return cart.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
}

export function changeCartItemQuantity(id, delta) {
  const cart = loadCart();

  const item = cart.find((entry) => entry.id === id);
  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    const filtered = cart.filter((entry) => entry.id !== id);
    saveCart(filtered);
  } else {
    saveCart(cart);
  }
}

export function removeCartItem(id) {
  const cart = loadCart();
  const filtered = cart.filter((entry) => entry.id !== id);
  saveCart(filtered);
}

export function clearCart() {
  saveCart([]);
}
