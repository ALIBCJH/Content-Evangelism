/**
 * A listing broken into the days it was published on.
 *
 * The archive below the lead is an index rather than a shop window: a
 * reader who has passed the newest teaching is looking for one they have
 * not read, and what helps them is a straight run of headlines they can
 * take in at a glance. Days are the natural rests in that run — the
 * ministry publishes in bursts, so a date heading gathers three or four
 * teachings that arrived together and separates them from the ones that
 * did not.
 *
 * Numbering runs through the whole listing rather than restarting inside
 * each day, and it counts the lead as the first: what the number says is
 * "this is the fourth-newest thing here", which is a fact about the
 * archive, not about the group it happens to sit in.
 */

/**
 * "18 August 2026". UTC, deliberately.
 *
 * The listing renders in the browser as well as on the server — it is
 * filtered and searched there — so a date formatted in the machine's own
 * zone would be one date in the build and another in Nairobi, and React
 * would replace the heading on hydration. Every other dateline on this
 * site is fixed to UTC for the same reason; see `dateline`.
 */
const LONG_DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export function longDate(iso: string): string {
  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? iso : LONG_DATE.format(parsed)
}

export interface DatedEntry<T> {
  /** Its place in the whole listing, the lead included. */
  number: number
  item: T
}

export interface DatedGroup<T> {
  /** "18 August 2026", or null for a listing that is not in date order. */
  date: string | null
  entries: DatedEntry<T>[]
}

/**
 * The listing, grouped into consecutive runs of one day.
 *
 * Consecutive runs rather than a tally by date, and the difference
 * matters: a set that is not in date order would otherwise be gathered
 * into days that are nowhere near each other on the page, and the reader
 * would be shown the same heading three times down one column. A run is
 * only ever what it looks like — the things next to each other.
 *
 * `startAt` is the number the first entry carries. The archive passes 2,
 * because the lead above this list is the first.
 */
export function datedGroups<T extends { publishedAt: string }>(
  items: T[],
  startAt = 1
): DatedGroup<T>[] {
  const groups: DatedGroup<T>[] = []
  items.forEach((item, index) => {
    const date = longDate(item.publishedAt)
    const open = groups[groups.length - 1]
    if (open && open.date === date) open.entries.push({ number: startAt + index, item })
    else groups.push({ date, entries: [{ number: startAt + index, item }] })
  })
  return groups
}

/**
 * The same listing with no dates on it, as one group.
 *
 * For a set a reader has reordered by searching it, where the order is
 * relevance and a date heading would be claiming a chronology the list
 * does not have. The numbering still runs, because it is still true: it
 * says where each result sits in what is being shown.
 */
export function ungrouped<T extends { publishedAt: string }>(
  items: T[],
  startAt = 1
): DatedGroup<T>[] {
  if (items.length === 0) return []
  return [
    { date: null, entries: items.map((item, index) => ({ number: startAt + index, item })) },
  ]
}
