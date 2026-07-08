/**
 * The user's selected hotel, remembered across pages and visits.
 * Stored twice: a cookie (so server pages can resolve it without a URL
 * param) and localStorage (fast client reads in flow screens).
 * It is a UI preference only — every server page still validates it
 * against the user's accessible properties.
 */
export const PROPERTY_COOKIE = "laundry_property_id";
export const LS_PROPERTY = "laundry:lastPropertyId";

/** Client-side: remember a picked hotel. No-op on the server. */
export function rememberProperty(id: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_PROPERTY, id);
  } catch {
    // ignore
  }
  try {
    document.cookie = `${PROPERTY_COOKIE}=${encodeURIComponent(
      id
    )}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // ignore
  }
}

/** Client-side: last remembered hotel id, if any. */
export function readRememberedPropertyId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LS_PROPERTY);
  } catch {
    return null;
  }
}
