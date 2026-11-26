/**
 * Booking dates built relative to today, so tests never go stale.
 * All math is done on calendar dates in UTC and returned as yyyy-mm-dd,
 * the format a date <input> accepts with fill().
 */
const DAY_MS = 24 * 60 * 60 * 1000;

function todayUtc(): number {
  const now = new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

function iso(utcMs: number): string {
  return new Date(utcMs).toISOString().slice(0, 10);
}

/** yyyy-mm-dd for today + n days (negative n = past). */
export function daysFromToday(n: number): string {
  return iso(todayUtc() + n * DAY_MS);
}

/** yyyy-mm-dd for the given date + n days. */
export function addDays(date: string, n: number): string {
  return iso(Date.parse(date) + n * DAY_MS);
}

export interface Stay {
  checkIn: string;
  checkOut: string;
}

/** A stay of `nights` nights starting `startInDays` days from today. */
export function stay(startInDays: number, nights: number): Stay {
  const checkIn = daysFromToday(startInDays);
  return { checkIn, checkOut: addDays(checkIn, nights) };
}

/** First year (from next week on) where `month/day` is still ahead of us. */
function nextYearWith(month: number, day: number, accept: (year: number) => boolean = () => true): number {
  const earliest = todayUtc() + 7 * DAY_MS;
  let year = new Date(earliest).getUTCFullYear();
  while (Date.UTC(year, month - 1, day) < earliest || !accept(year)) year++;
  return year;
}

const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** Dec 30 → Jan 2 of the next upcoming year boundary (3 nights). */
export function nextYearBoundaryStay(): Stay {
  const y = nextYearWith(12, 30);
  return { checkIn: `${y}-12-30`, checkOut: `${y + 1}-01-02` };
}

/** Feb 28 → Mar 1 of the next upcoming leap year (2 nights, over Feb 29). */
export function nextLeapDayStay(): Stay {
  const y = nextYearWith(2, 28, isLeapYear);
  return { checkIn: `${y}-02-28`, checkOut: `${y}-03-01` };
}

/**
 * Saturday → Monday around the next EU summer-time start (last Sunday of March),
 * 2 nights. Run the test with timezoneId 'Europe/Berlin' so the clock change is real.
 */
export function nextDstStartStay(): Stay {
  const lastSundayOfMarch = (y: number) => {
    const mar31 = Date.UTC(y, 2, 31);
    return mar31 - new Date(mar31).getUTCDay() * DAY_MS;
  };
  const earliest = todayUtc() + 7 * DAY_MS;
  let y = new Date(earliest).getUTCFullYear();
  while (lastSundayOfMarch(y) - DAY_MS < earliest) y++;
  const sunday = lastSundayOfMarch(y);
  return { checkIn: iso(sunday - DAY_MS), checkOut: iso(sunday + DAY_MS) };
}
