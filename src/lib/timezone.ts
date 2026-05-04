// Helpers for working with the business's local timezone (Bay Harbor Islands, FL = America/New_York).
// All `scheduledAt` values are stored in UTC; these helpers translate to/from "wall-clock" time.

export const BUSINESS_TZ = "America/New_York";

// Convert a "YYYY-MM-DD" date and "HH:mm" time interpreted in BUSINESS_TZ into a UTC Date.
// Iteratively converges on the correct DST-aware offset.
export function dateInBusinessTz(dateStr: string, timeStr: string): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = timeStr.split(":").map(Number);
  if ([y, mo, d, h, mi].some((n) => Number.isNaN(n))) {
    throw new Error(`Invalid date/time: ${dateStr} ${timeStr}`);
  }
  const target = Date.UTC(y, mo - 1, d, h, mi, 0);

  // Two iterations is enough across DST transitions.
  let utc = target;
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: BUSINESS_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date(utc));
    const get = (t: string) => parts.find((p) => p.type === t)!.value;
    const candHour = parseInt(get("hour"), 10) % 24;
    const candUtc = Date.UTC(
      parseInt(get("year"), 10),
      parseInt(get("month"), 10) - 1,
      parseInt(get("day"), 10),
      candHour,
      parseInt(get("minute"), 10),
      0
    );
    const diff = target - candUtc;
    if (diff === 0) break;
    utc += diff;
  }
  return new Date(utc);
}

// Format a Date as "HH:mm" in BUSINESS_TZ.
export function formatBusinessTime(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

// Format a Date as a friendly string (e.g. "Saturday, June 14") in BUSINESS_TZ.
export function formatBusinessDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(d);
}

// Format a Date as full "weekday, month day · h:mm AM/PM ET" in BUSINESS_TZ.
export function formatBusinessDateTime(d: Date): string {
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  return `${date} · ${time} ET`;
}

// Today in business TZ as "YYYY-MM-DD"
export function todayInBusinessTz(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
