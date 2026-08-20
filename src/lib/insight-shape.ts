/**
 * The shape of what is counted — the labels, the types, and the checks.
 *
 * Split from the store because the desk's own page is a client component
 * and imports these: anything sharing a module with `node:fs` is dragged
 * into the browser bundle with it, and the build says so.
 */

/**
 * The kinds of click worth counting, and the only ones accepted.
 *
 * A fixed list rather than a free label: the field name goes into the
 * store, so anything posting arbitrary labels could grow the store without
 * bound. An unknown label is dropped rather than stored.
 */
export const CLICK_LABELS = [
  'read-article',
  'listen-article',
  'play-teaching',
  'open-record',
  'watch-youtube',
  'hero-primary',
  'hero-secondary',
  'prophecy-archive',
] as const
export type ClickLabel = (typeof CLICK_LABELS)[number]

export interface PageInsight {
  path: string
  views: number
  /** Engaged seconds, summed across all readers of this page. */
  seconds: number
  /** Times a reader reached the foot of the piece. */
  finished: number
  clicks: Partial<Record<ClickLabel, number>>
}

export interface EventBatch {
  path: string
  views?: number
  seconds?: number
  finished?: number
  clicks?: ClickLabel[]
}

/* ── Validation ───────────────────────────────────────────────────── */

/** A site path, and nothing else — no query, no host, no traversal. */
export function cleanPath(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const value = raw.split('?')[0].split('#')[0].trim()
  if (!value.startsWith('/') || value.length > 120) return null
  if (value.includes('..') || value.includes('::')) return null
  return /^[a-z0-9/_-]*$/i.test(value) ? (value === '/' ? '/' : value.replace(/\/$/, '')) : null
}

/**
 * A reader cannot be on a page for a week. Anything longer than a
 * plausible sitting is a clock change, a resumed laptop, or someone
 * posting nonsense, and is discarded rather than averaged in.
 */
const MAX_SECONDS_PER_BATCH = 30 * 60

export function cleanBatch(raw: unknown): EventBatch | null {
  if (!raw || typeof raw !== 'object') return null
  const input = raw as Record<string, unknown>
  const p = cleanPath(input.path)
  if (!p) return null

  const count = (v: unknown, max: number): number => {
    const n = typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : 0
    return n > 0 ? Math.min(n, max) : 0
  }

  const clicks = Array.isArray(input.clicks)
    ? (input.clicks.filter(
        (c): c is ClickLabel => typeof c === 'string' && (CLICK_LABELS as readonly string[]).includes(c)
      ).slice(0, 50))
    : []

  const batch: EventBatch = {
    path: p,
    views: count(input.views, 1),
    seconds: count(input.seconds, MAX_SECONDS_PER_BATCH),
    finished: count(input.finished, 1),
    clicks,
  }
  const empty = !batch.views && !batch.seconds && !batch.finished && clicks.length === 0
  return empty ? null : batch
}
