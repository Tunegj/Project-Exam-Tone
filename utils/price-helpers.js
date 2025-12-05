// price helpers

/**
 *Returns the discounted or regular price as a number
 * @param {Object} p - product object
 * @returns {number}
 */
export function finalPrice(p) {
  const price = Number(p?.price ?? 0);
  const discounted = Number(p?.discountedPrice ?? price);
  return discounted;
}

/**
 *Returns true if the product is on sale
 * @param {Object} p - product object
 * @returns {boolean}
 */
export function isOnSale(p) {
  return finalPrice(p) < Number(p?.price ?? 0);
}

/**
 *Formats a number as a currency string
 * @param {number} n - Value
 * @param {string} currency - Default NOK
 * @returns {string}
 */

export function money(n, currency = "NOK") {
  const value = Number(n || 0);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)}${currency}`;
  }
}
