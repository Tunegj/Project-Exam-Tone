const USER_KEY = "mirae-user";

export function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    if (typeof parsed === "object" && parsed !== null) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.error("Failed to parse user profile", error);
    return null;
  }
}

export function saveUser(profile) {
  try {
    const json = JSON.stringify(profile);
    localStorage.setItem(USER_KEY, json);
  } catch (error) {
    console.error("failed to save user profile", error);
  }
}
