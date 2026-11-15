// Business days are Colombian days. Bogota is UTC-5 all year (no daylight saving time),
// so a calendar day there is [YYYY-MM-DDT00:00-05:00, next day) in UTC.
export const BUSINESS_TZ = 'America/Bogota';
const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's date in Bogota as YYYY-MM-DD. */
export const todayInBogota = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TZ }).format(now);

/** UTC instants that bound one Bogota calendar day. */
export function dayRange(date: string) {
  const start = new Date(`${date}T00:00:00-05:00`);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}
