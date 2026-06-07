/** IST calendar-day helpers for compliance and reports. */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Parse YYYY-MM-DD as start of that IST calendar day (UTC instant). */
export function istDayStartUtc(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - IST_OFFSET_MS);
}

/** Exclusive end of IST calendar day (start of next IST day). */
export function istDayEndUtc(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0) - IST_OFFSET_MS);
}

/** End-of-day IST instant for backdated occurredAt (23:59:59.999 IST). */
export function istDayEndInstant(dateKey: string): Date {
  const end = istDayEndUtc(dateKey);
  return new Date(end.getTime() - 1);
}

export function isValidDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
