/** Date helpers. All keys are LOCAL calendar days in YYYY-MM-DD format, which is
 *  how workouts are bucketed in the database. */

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

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "Monday, September 22" */
export function formatFullDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS_LONG[date.getMonth()]} ${date.getDate()}`;
}

/** "Mon, Sep 22" */
export function formatShortDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()].slice(0, 3)}, ${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
}

/** "Sep 22" */
export function formatMonthDay(date: Date): string {
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
}

/** "M" / "T" / "W" ... */
export function weekdayInitial(date: Date): string {
  return WEEKDAYS[date.getDay()].charAt(0);
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
