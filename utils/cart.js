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
