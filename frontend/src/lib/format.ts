import { differenceInCalendarDays, format, parseISO } from "date-fns";

export function formatPrice(cents: number, opts?: { withCents?: boolean }): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts?.withCents ? 2 : 0,
    maximumFractionDigits: opts?.withCents ? 2 : 0,
  }).format(dollars);
}

export function formatNightlyPrice(cents: number): string {
  return formatPrice(cents);
}

/** Round rating to one decimal, e.g. 4.8. */
export function formatRating(rating: number): string {
  return rating.toFixed(rating % 1 === 0 ? 1 : 1);
}

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseISODate(value: string): Date {
  return parseISO(value);
}

export function formatDateRange(checkIn: string, checkOut: string): string {
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
  }
  return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
}

export function formatShortDate(value: string): string {
  return format(parseISO(value), "MMM d, yyyy");
}

export function formatMessageTime(value: string): string {
  return format(parseISO(value), "MMM d · h:mm a");
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  return Math.max(0, differenceInCalendarDays(checkOut, checkIn));
}
