/** Date helpers. All keys are LOCAL calendar days in YYYY-MM-DD format, which is
 *  how workouts are bucketed in the database. */

import i18n from '../i18n';

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function isValidDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  return toDateKey(parseDateKey(key)) === key;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

const locale = () => i18n.language || 'en';
const fmt = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale(), options).format(date);

/** "Monday, September 22" (localized) */
export function formatFullDate(date: Date): string {
  return fmt(date, { weekday: 'long', month: 'long', day: 'numeric' });
}

/** "Mon, Sep 22" (localized) */
export function formatShortDate(date: Date): string {
  return fmt(date, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "Sep 22" (localized) */
export function formatMonthDay(date: Date): string {
  return fmt(date, { month: 'short', day: 'numeric' });
}

/** "September 2025" (localized) */
export function formatMonthYear(date: Date): string {
  return fmt(date, { month: 'long', year: 'numeric' });
}

/** Narrow weekday letter: "M" / "T" / "W" ... (localized) */
export function weekdayInitial(date: Date): string {
  return fmt(date, { weekday: 'narrow' });
}

/**
 * Current streak of consecutive days (ending today or yesterday) with at least
 * one completed exercise. `activeDays` is a set of YYYY-MM-DD keys.
 */
export function computeStreak(activeDays: Set<string>): number {
  const today = new Date();
  let cursor = activeDays.has(toDateKey(today)) ? today : addDays(today, -1);
  if (!activeDays.has(toDateKey(cursor))) return 0;
  let streak = 0;
  while (activeDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
