// price helpers

export function finalPrice(p) {
  return p?.discountedPrice ?? p?.price ?? 0;
}

export function isOnSale(p) {
  const price = p?.price ?? 0;
  const discounted = p?.discountedPrice ?? price;
  return discounted < price;
}

// format number as currency string
export function money(n) {
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
