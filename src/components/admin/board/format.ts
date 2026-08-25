import { isFresh, postedAgo } from '@/lib/when'

/**
 * How numbers are printed on the board.
 *
 * Gathered rather than scattered, because the same figure appearing as
 * "1200", "1.2k" and "1,200" in three bands of one page reads as three
 * different measurements.
 */

/** Whole numbers with thousands separated. Nothing abbreviated: this is a
 *  desk, and 1.2k is a rounding somebody has to undo in their head. */
export const count = (n: number): string => n.toLocaleString('en-KE')

/**
 * A stretch of engaged time, at the coarsest unit that still says
 * something. Seconds up to a minute, minutes up to a day, then hours.
 */
export function duration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  const hours = seconds / 3600
  return hours < 10 ? `${hours.toFixed(1)}h` : `${Math.round(hours)}h`
}

/** A rate as whole per cent. */
export const percent = (rate: number): string => `${Math.round(rate * 100)}%`

/**
 * A change against the stretch before, or nothing.
 *
 * Null means there was nothing to compare against — a site with no visits
 * last month and forty this month has not grown by a percentage, it has
 * started — and the board prints a dash rather than an infinity.
 */
export function change(rate: number | null): { text: string; direction: 'up' | 'down' | 'flat' } {
  if (rate === null) return { text: '—', direction: 'flat' }
  const rounded = Math.round(rate * 100)
  if (rounded === 0) return { text: 'level', direction: 'flat' }
  return {
    text: `${rounded > 0 ? '+' : ''}${rounded}%`,
    direction: rounded > 0 ? 'up' : 'down',
  }
}

/**
 * A stored date as the desk reads it: recency for the first day, a date
 * after that.
 *
 * The date stays the board's own short form rather than `when.ts`'s
 * "24 August 2026" — these are dense tables, and a long month name
 * widens a column to say nothing more.
 *
 * The whole board renders in the browser, so the rule may be applied
 * directly here: the clock is the reader's own, and there is no
 * server-rendered HTML for it to disagree with.
 */
export const dated = (iso?: string): string => {
  if (!iso) return '—'
  const now = Date.now()
  if (isFresh(iso, now)) return postedAgo(iso, now)
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return iso
  return parsed.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * A heading anchor as words.
 *
 * The store keeps the id the markup already carried — "what-repentance-
 * costs" — and the desk should be shown the heading, not the slug.
 */
export function headingWords(id: string): string {
  const words = id.replace(/-/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** The click labels, as something a person would say. */
export const CLICK_WORDS: Record<string, string> = {
  'read-article': 'Opened a teaching',
  'listen-article': 'Listened instead of reading',
  'follow-channel': 'Followed the channel',
  'share-passage': 'Shared a passage',
  'play-teaching': 'Played a teaching',
  'open-record': 'Opened a record',
  'watch-youtube': 'Watched on YouTube',
  'hero-primary': 'Took the front page’s first invitation',
  'hero-secondary': 'Took the front page’s second invitation',
  'prophecy-archive': 'Went to the prophecy archive',
}
