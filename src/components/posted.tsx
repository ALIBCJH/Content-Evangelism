'use client'

import * as React from 'react'
import { isFresh, postedAgo, postedDate } from '@/lib/when'

/**
 * When a piece was posted, on a page the server rendered.
 *
 * The rule is in `when.ts`: recency for the first day, a date after
 * that. Applying it on the server would break in two ways at once. These
 * pages are generated and then served from a cache for as long as the
 * revalidation window, so "moments ago" would be baked into HTML still
 * being handed out hours later; and even freshly built, the server's
 * answer and the browser's first render would differ, which is a
 * hydration mismatch.
 *
 * So the server always renders the date, the browser renders the date
 * too on its first pass — the two agree, which is the whole requirement
 * — and only afterwards, in an effect, does a fresh piece become "3
 * hours ago". A reader with no JavaScript keeps the date, which is the
 * correct answer rather than a degraded one.
 *
 * The `dateTime` attribute carries the full timestamp throughout, so
 * what a search engine or a screen reader is given never depends on any
 * of this.
 */

/**
 * Null until the browser has taken over, and a clock afterwards — but
 * only for a piece young enough for the answer to change. A teaching
 * from March will not become newer while somebody reads it, so it never
 * sets state at all and never re-renders.
 */
function useFreshClock(iso: string): number | null {
  const [now, setNow] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (!isFresh(iso, Date.now())) return
    setNow(Date.now())

    /* A minute is the finest granularity `postedAgo` prints below an
       hour, so anything faster re-renders to the same words. */
    const tick = setInterval(() => {
      const at = Date.now()
      setNow(at)
      if (!isFresh(iso, at)) clearInterval(tick)
    }, 60_000)
    return () => clearInterval(tick)
  }, [iso])

  return now !== null && isFresh(iso, now) ? now : null
}

export function Posted({
  iso,
  dated,
  className,
}: {
  iso: string
  /**
   * How this surface writes a date, when the piece is no longer fresh —
   * "24 Aug 2026" in a dense list, "AUG 12, 2026" in the archive.
   * Omitted, it is the site's ordinary "24 August 2026".
   *
   * The caller owns the date because each surface already had its own
   * form and there is no reason to flatten them; the component owns only
   * the question of which of the two to show. Casing is left to the CSS
   * that was already uppercasing these lines.
   */
  dated?: string
  className?: string
}) {
  const now = useFreshClock(iso)
  return (
    <time dateTime={iso} className={className}>
      {now !== null ? postedAgo(iso, now) : (dated ?? postedDate(iso))}
    </time>
  )
}
