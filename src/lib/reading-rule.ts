/**
 * What counts as having read a teaching.
 *
 * There are two trackers on this site and they answered this question
 * differently, which is how the question got asked at all. The
 * ministry's counters (`read-insight.ts`) call a teaching finished at
 * nine tenths of scroll depth; the reader's own shelf
 * (`reading-progress.ts`) called it at ninety-five hundredths. Neither
 * consulted the clock.
 *
 * Scroll depth on its own is not reading. A twelve-minute teaching can
 * be flicked to the bottom in about three seconds, and on a phone that
 * happens by accident — momentum carries a thumb past the end of a page
 * nobody looked at. Both trackers recorded that as read, and the shelf
 * kept the furthest point ever reached, so one accidental flick marked a
 * teaching read for good with no way to undo it.
 *
 * The odd part is that the harder half was already built. The counters
 * accumulate *engaged* seconds — time while the teaching is on screen,
 * the tab is visible, and the reader has done something in the last two
 * minutes — and then decided "finished" without looking at them. So this
 * is not new machinery. It is one rule, in one place, that both trackers
 * now ask.
 *
 * Deliberately pure: no DOM, no `'use client'`, nothing to import but
 * numbers. Both callers are browser code and neither can be the home of
 * a rule the other depends on.
 */

/**
 * How long a reader may sit still before their seconds stop counting.
 *
 * Two minutes, the same window the ministry's counters use. Shorter and
 * a slow reader on a long paragraph stops counting mid-sentence; longer
 * and a tab left open in another window starts counting as reading.
 */
export const IDLE_AFTER_MS = 2 * 60 * 1000

/**
 * How far through the body counts as having reached the end.
 *
 * Nine tenths rather than the whole, because the last tenth of an
 * article element is footnotes, the related-teachings block and white
 * space, and a reader who has arrived there has read the teaching.
 */
export const FINISH_DEPTH = 0.9

/** Under this, a page was opened rather than begun. */
export const BEGIN_DEPTH = 0.08

/**
 * And under this many engaged seconds, likewise.
 *
 * Ten seconds is about as long as it takes to decide a page is not what
 * you wanted. Without it the shelf fills with teachings that were opened
 * and nudged, which is the same failure as counting a flick as reading,
 * at the other end of the page.
 */
export const BEGIN_SECONDS = 10

/**
 * The share of a teaching's estimated reading time a reader has to
 * actually spend on it.
 *
 * `readMinutes` is words divided by two hundred, and plenty of people
 * read at three hundred — so requiring the whole estimate would mark
 * genuine readers unfinished, and a shelf that tells somebody they did
 * not finish something they did is a shelf they stop believing. The
 * error is not symmetric: being too generous here costs a slightly
 * inflated count, being too strict costs the reader's trust in the
 * feature.
 *
 * A third of the estimate is two minutes on a six-minute teaching. That
 * admits a fast reader and a genuine skimmer, and excludes a thumb.
 */
export const FINISH_SHARE = 0.35

/** However short the teaching, this many seconds at least. */
export const FINISH_FLOOR_SECONDS = 20

/**
 * What the prompt at the foot of a teaching asks for, which is much less.
 *
 * These are two different questions and it took getting them confused
 * once to see it. `hasFinished` decides what the archive *records* — the
 * shelf that says "read", the counter the desk reads — and it has to be
 * strict, because a number that counts flicks as readings is a number
 * that lies to the ministry about its own work.
 *
 * `reachedTheEnd` decides whether to *offer somebody a heart*. Getting
 * that wrong costs nothing: the worst case is a reader who skimmed is
 * asked whether it helped them, and answers no or ignores it. The worst
 * case of being strict is a reader who read the whole thing at speed and
 * is never asked — which is a real reader silently refused.
 *
 * So the offer follows the scrollbar and the statistics follow the
 * clock. Twelve seconds is only there to keep a three-second flick out;
 * anybody who has genuinely scrolled through a teaching clears it
 * without noticing.
 */
export const PROMPT_SECONDS = 12

/** The engaged seconds a given teaching asks for before it counts as read. */
export function secondsToFinish(readMinutes: number): number {
  const share = Math.round(Math.max(0, readMinutes) * 60 * FINISH_SHARE)
  return Math.max(FINISH_FLOOR_SECONDS, share)
}

/**
 * Far enough through to be offered the question at the foot.
 *
 * Deliberately not `hasFinished` — see `PROMPT_SECONDS`. This is the end
 * of the writing plus enough seconds to rule out a thumb, and nothing
 * more. It never feeds a count.
 */
export function reachedTheEnd(depth: number, engagedSeconds: number): boolean {
  return depth >= FINISH_DEPTH && engagedSeconds >= PROMPT_SECONDS
}

/** Far enough in, and long enough there, to be reading rather than looking. */
export function hasBegun(depth: number, engagedSeconds: number): boolean {
  return depth >= BEGIN_DEPTH && engagedSeconds >= BEGIN_SECONDS
}

/**
 * Read: to the end of the body, and for long enough to have read it.
 *
 * Both halves, always. Depth without time is the flick this rule exists
 * to catch; time without depth is a tab left open on a page somebody
 * stopped reading in the third paragraph.
 */
export function hasFinished(
  depth: number,
  engagedSeconds: number,
  readMinutes: number
): boolean {
  return depth >= FINISH_DEPTH && engagedSeconds >= secondsToFinish(readMinutes)
}
