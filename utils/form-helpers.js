/**
 * Wire inputs to their matching error elements via aria-describedby
 *
 * For each input/textarea/select with a `name`, this looks for:
 * [data-error-for="<name>"]
 * inside the same form, gives that error element an ID, and
 * adds it to the field's aria-describedby.
 *
 * @param {HTMLFormElement||null} form
 */

export function setupFieldAccessibility(form) {
  if (!form) return;

  const fields = form.querySelectorAll("input, textarea, select");

  fields.forEach((field) => {
    const name = field.getAttribute("name");
    if (!name) return;

    const errorEl = form.querySelector(`[data-error-for="${name}"]`);
    if (!errorEl) return;

    if (!errorEl.id) {
      errorEl.id = `${name}-error`;
    }

    const existing = field.getAttribute("aria-describedby") || "";
    const ids = new Set(
      existing
        .split(/\s+/)
        .map((id) => id.trim())
        .filter(Boolean)
    );
    ids.add(errorEl.id);

    field.setAttribute("aria-describedby", Array.from(ids).join(" "));
  });
}

/**
 * Clear all field-level errors and aria-invalid in a form.
 *
 * Looks for:
 * - Any element with [data-error-for]
 * - Any field with aria-invalid="true"
 *
 * @param {HTMLFormElement||null} form
 */
export function clearFieldErrors(form) {
  if (!form) return;

  const errorEls = form.querySelectorAll("[data-error-for]");
  errorEls.forEach((el) => {
    el.textContent = "";

    if (el.dataset) {
      el.dataset.type = "";
    }
  });

  const invalidFields = form.querySelectorAll('[aria-invalid="true"]');
  invalidFields.forEach((field) => {
    field.removeAttribute("aria-invalid");
  });
}

/**
 * Apply a map of field errors to a form.
 * - Sets error text on [data-error-for="<field>"] elements
 * - Sets aria-invalid="true" on matching fields
 * - Returns the first invalid field for focusing
 *
 * @param {HTMLFormElement||null} form
 * @param {Record<string, string>} errors - Map of field name --> error message.
 * @returns {HTMLElement|null} - The first invalid field, or null.
 */
export function applyFieldErrors(form, errors) {
  if (!form) return null;

  let firstInvalidField = null;

  Object.entries(errors).forEach(([name, message]) => {
    const errorEl = form.querySelector(
      `[data-error-for="${CSS.escape(name)}"]`
    );
    if (errorEl) {
      errorEl.textContent = message;
      // @ts-ignore
      if (errorEl.dataset) {
        errorEl.dataset.type = "error";
      }
    }

    const field = form.elements.namedItem(name);
    if (field && "setAttribute" in field) {
      field.setAttribute("aria-invalid", "true");
      if (!firstInvalidField) {
        firstInvalidField = /**@type {HTMLElement} */ (field);
      }
    }
  });

  return firstInvalidField;
}
