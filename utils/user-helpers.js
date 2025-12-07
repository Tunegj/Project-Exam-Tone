const USER_KEY = "mirae-user";

/**
 * Load the user profile from local storage.
 * @returns {Object||null} The user profile or null if not foud/invalid.
 */

export function testAdminLogin() {
  const existing = loadUser();
  if (existing) return;

  const adminUser = {
    firstName: "Admin",
    lastName: "User",
    email: "admin@stud.noroff.no",
    password: "admin1234",
  };

  saveUser(adminUser);
}

testAdminLogin();

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

/**
 * Save a user profile to local storage.
 * @param {Object} profile
 */
export function saveUser(profile) {
  try {
    const json = JSON.stringify(profile);
    localStorage.setItem(USER_KEY, json);
  } catch (error) {
    console.error("failed to save user profile", error);
  }
}

/**
 * Remove the saved user profile from local storage (used for logout).
 */
export function clearUser() {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error("failed to clear user profile", error);
  }
}
