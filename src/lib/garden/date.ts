import type { LocaleCode } from "@/lib/i18n/locale";

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Local midnight of the given date, so day maths never drifts across time zones. */
export function startOfDay(value: Date | string): Date {
  const date = typeof value === "string" ? new Date(value) : new Date(value.getTime());
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(value: Date | string, days: number): Date {
  const date = startOfDay(value);
  date.setDate(date.getDate() + days);
  return date;
}

/** Whole calendar days from `from` to `to`; negative means `to` is in the past. */
export function dayDiff(from: Date | string, to: Date | string): number {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  return Math.round((b - a) / MS_PER_DAY);
}

export function toDateKey(value: Date | string): string {
  const date = startOfDay(value);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function dayOfMonth(value: Date | string): string {
  return `${startOfDay(value).getDate()}`.padStart(2, "0");
}

export function weekdayName(value: Date | string, locale: LocaleCode): string {
  return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(
    typeof value === "string" ? new Date(value) : value,
  );
}

export function monthName(value: Date | string, locale: LocaleCode): string {
  return new Intl.DateTimeFormat(locale, { month: "long" }).format(
    typeof value === "string" ? new Date(value) : value,
  );
}

export function monthDay(value: Date | string, locale: LocaleCode): string {
  return new Intl.DateTimeFormat(locale, { month: "long", day: "numeric" }).format(
    typeof value === "string" ? new Date(value) : value,
  );
}

export function fullDate(value: Date | string, locale: LocaleCode): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function timeOfDay(value: Date | string, locale: LocaleCode): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function currentGreetingKey(hour = new Date().getHours()) {
  if (hour < 11) return "morning" as const;
  if (hour < 14) return "noon" as const;
  if (hour < 18) return "afternoon" as const;
  return "evening" as const;
}
