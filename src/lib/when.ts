import { formatDistanceStrict, parseISO } from 'date-fns'

/**
 * When a piece was posted, as a person reads it.
 *
 * A date is the right answer for almost everything on this site — a
 * teaching from March is a teaching from March, and "168 days ago" is a
 * number somebody has to convert back into one. But it is the wrong
 * answer for the first day of a piece's life, when the only question
 * anybody is asking is whether it is new, and "25 August 2026" on the
 * twenty-fifth of August answers nothing.
 *
 * So: recency while a piece is fresh, and a date once it is not. The
 * cutover is a day, which is where the question changes from "has this
 * just gone up" to "when was this".
 */

/** How long a piece reads as new. */
export const FRESH_MS = 24 * 3600_000

export function isFresh(iso: string, now: number): boolean {
  const at = new Date(iso).getTime()
  /* An unparseable date is not fresh. It falls through to the date
     branch, which hands back the raw string rather than "Invalid Date". */
  if (Number.isNaN(at)) return false
  /* A timestamp in the future is a clock disagreeing with itself, not a
     piece posted tomorrow, and reads better as new than as a date. */
  return at > now - FRESH_MS
}

const DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** "24 August 2026", or the string back if it is not a date at all. */
export function postedDate(iso: string): string {
  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? iso : DATE.format(parsed)
}

/**
 * "3 hours ago". Only ever asked for a date that `isFresh`.
 *
 * Against the `now` it is handed rather than the clock, so that the one
 * moment a caller decided to render at governs both halves of the rule.
 * A function that took a `now` for the decision and then read the clock
 * for the words could say "yesterday's date" and "2 minutes ago" about
 * the same piece.
 */
export function postedAgo(iso: string, now: number): string {
  try {
    return formatDistanceStrict(parseISO(iso), new Date(now), { addSuffix: true })
  } catch {
    return postedDate(iso)
  }
}

/**
 * The whole rule in one call, for anywhere already rendering in the
 * browser — the desk, which fetches its own data and so has a clock that
 * agrees with the reader's.
 *
 * Server-rendered pages must not call this. A page built at noon and
 * served from the cache at four would say "moments ago" four hours later,
 * and disagree with the browser on the first render besides. Those use
 * `<Posted>`, which renders the date and upgrades.
 */
export function postedWhen(iso: string, now: number): string {
  return isFresh(iso, now) ? postedAgo(iso, now) : postedDate(iso)
}
