const AUTH_KEY = "mirae-auth";

/**
 * Save auth token to localStorage
 * @param {Object} auth
 */
export function saveAuthToken(auth) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  } catch (error) {
    console.error("Failed to save auth token:", error);
  }
}

/**
 * Load auth token from localStorage
 * @returns {Object||null}
 */
export function loadAuthToken() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse auth token:", error);
    return null;
  }
}

/**
 * Check if user is logged in
 * @returns {boolean}
 */
export function isLoggedIn() {
  const auth = loadAuthToken();
  return Boolean(auth?.accessToken || auth?.token);
}

/**
 * Remove auth information from localStorage.
 * Can be used directly for logging out.
 */
export function logout() {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch (error) {
    console.error("Failed to remove auth token:", error);
  }
}

/**
 * Get the current auth token, if any
 * @returns {string||null}
 */
export function getAuthToken() {
  const auth = loadAuthToken();
  return auth?.accessToken || auth?.token || null;
}
