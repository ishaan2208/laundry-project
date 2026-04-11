/** Asia/Kolkata weekday boundaries for weekly audit snapshots (no DST). */
export const STOCK_AUDIT_TIMEZONE = "Asia/Kolkata";

const WD_MON0: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

/** IST calendar year/month/day for an instant. */
export function getIstYmd(d: Date): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STOCK_AUDIT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const o: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") o[p.type] = p.value;
  }
  return {
    y: Number(o.year),
    m: Number(o.month),
    d: Number(o.day),
  };
}

/** Instant when clocks in IST read 00:00 on the given IST calendar date. */
export function midnightIstUtc(y: number, m: number, d: number): Date {
  return new Date(
    Date.UTC(y, m - 1, d) - (5 * 60 + 30) * 60 * 1000
  );
}

export function addDaysIst(
  y: number,
  m: number,
  d: number,
  delta: number
): { y: number; m: number; d: number } {
  const t = midnightIstUtc(y, m, d).getTime() + delta * 86_400_000;
  return getIstYmd(new Date(t));
}

function weekdayIndexMon0Ist(y: number, m: number, d: number): number {
  const w = new Intl.DateTimeFormat("en-US", {
    timeZone: STOCK_AUDIT_TIMEZONE,
    weekday: "short",
  }).format(midnightIstUtc(y, m, d));
  return WD_MON0[w] ?? 0;
}

/** Monday (IST) calendar date containing `d`. */
export function startOfIstWeekMondayParts(
  d: Date = new Date()
): { y: number; m: number; d: number } {
  const { y, m, d: day } = getIstYmd(d);
  const wd = weekdayIndexMon0Ist(y, m, day);
  return addDaysIst(y, m, day, -wd);
}

export function ymdToDateOnlyUtc(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
}

export function parseDateOnlyToParts(iso: string): {
  y: number;
  m: number;
  d: number;
} | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

/** True if (y,m,d) is Monday in IST. */
export function isIstMonday(y: number, m: number, d: number): boolean {
  return weekdayIndexMon0Ist(y, m, d) === 0;
}
