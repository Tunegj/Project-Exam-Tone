const AUTH_KEY = "mirae-auth";

export function saveAuthToken(auth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function loadAuthToken() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  const auth = loadAuthToken();
  return Boolean(auth?.token);
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}
