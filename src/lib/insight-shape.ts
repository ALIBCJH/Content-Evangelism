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
  'follow-channel',
  'share-passage',
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
  /**
   * Engaged seconds inside each chapter of the piece, by the heading's
   * own anchor. A teaching that holds readers in one section and loses
   * them in the next says something the page total cannot.
   */
  sections: Record<string, number>
}

export interface EventBatch {
  path: string
  /** Engaged seconds by heading anchor. */
  sections?: Record<string, number>
  views?: number
  seconds?: number
  finished?: number
  clicks?: ClickLabel[]
}

/* ── Validation ───────────────────────────────────────────────────── */

/** A site path, and nothing else — no query, no host, no traversal. */
/**
 * The shapes this site actually serves.
 *
 * The counter is open — a browser posts to it and there is no reader to
 * authenticate — and it was accepting any path-shaped string. Every new
 * string is a new field in the store, so anyone with a loop could have
 * grown it without limit: not a way in, but a way to fill the shelf the
 * ministry's own numbers live on. A page that is not one of these is not
 * a page of this site, and is not counted.
 */
const KNOWN_PATHS: RegExp[] = [
  /^\/$/,
  /^\/articles\/[a-z0-9-]{1,90}$/,
  /^\/prophecies$/,
  /^\/prophecies\/[a-z0-9-]{1,60}$/,
  /^\/teachings$/,
  /^\/teachings\/[a-z0-9-]{1,60}$/,
  /^\/topics\/[a-z0-9-]{1,40}$/,
  /^\/authors\/[a-z0-9-]{1,40}$/,
  /* Real pages that were shipping uncounted. The answered questions are
     published work with their own addresses, and the altars are the page
     a reader opens to find out where to go on Sunday — the desk could not
     see either of them being read. */
  /^\/questions$/,
  /^\/questions\/[a-z0-9-]{1,90}$/,
  /^\/altars$/,
  /^\/altars\/[a-z0-9-]{1,60}$/,
  /^\/search$/,
  /^\/about$/,
  /^\/docs\/api$/,
]

/**
 * The part of the site a path belongs to.
 *
 * "Where are readers spending their time" is not answerable page by page
 * — a hundred teachings each with a hundred visits look like nothing
 * beside one front page with two thousand, and the honest comparison is
 * between the rooms rather than the doors. The order here is the order
 * they are shown in.
 */
export const SITE_PARTS = [
  'Front page',
  'Articles',
  'Teachings',
  'Prophecies',
  'Questions',
  'Altars',
  'Topics',
  'Authors',
  'Search',
  'About',
  'API',
] as const
export type SitePart = (typeof SITE_PARTS)[number]

export function sitePart(path: string): SitePart {
  if (path === '/') return 'Front page'
  if (path.startsWith('/articles')) return 'Articles'
  if (path.startsWith('/teachings')) return 'Teachings'
  if (path.startsWith('/prophecies')) return 'Prophecies'
  if (path.startsWith('/questions')) return 'Questions'
  if (path.startsWith('/altars')) return 'Altars'
  if (path.startsWith('/topics')) return 'Topics'
  if (path.startsWith('/authors')) return 'Authors'
  if (path.startsWith('/search')) return 'Search'
  if (path.startsWith('/docs')) return 'API'
  return 'About'
}

export function cleanPath(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const value = raw.split('?')[0].split('#')[0].trim()
  if (!value.startsWith('/') || value.length > 120) return null
  if (value.includes('..') || value.includes('::')) return null
  if (!/^[a-z0-9/_-]*$/i.test(value)) return null
  const tidied = value === '/' ? '/' : value.replace(/\/$/, '')
  return KNOWN_PATHS.some((shape) => shape.test(tidied)) ? tidied : null
}

/**
 * A reader cannot be on a page for a week. Anything longer than a
 * plausible sitting is a clock change, a resumed laptop, or someone
 * posting nonsense, and is discarded rather than averaged in.
 */
const MAX_SECONDS_PER_BATCH = 30 * 60

/** A teaching has chapters, not hundreds of them. */
const MAX_SECTIONS_PER_BATCH = 40

/** The shape `headingId` produces, and nothing else. */
const SECTION_ID = /^[a-z0-9][a-z0-9-]{0,79}$/

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

  /* Anchors, not free text: a heading id is what the page already put in
     the markup, and anything else would let a caller name its own fields
     in the store. Bounded in count as well as in shape, so one batch
     cannot enumerate a store of its own. */
  const sections: Record<string, number> = {}
  if (input.sections && typeof input.sections === 'object' && !Array.isArray(input.sections)) {
    for (const [id, value] of Object.entries(input.sections as Record<string, unknown>).slice(
      0,
      MAX_SECTIONS_PER_BATCH
    )) {
      if (!SECTION_ID.test(id)) continue
      const seconds = count(value, MAX_SECONDS_PER_BATCH)
      if (seconds) sections[id] = seconds
    }
  }

  const batch: EventBatch = {
    path: p,
    views: count(input.views, 1),
    seconds: count(input.seconds, MAX_SECONDS_PER_BATCH),
    finished: count(input.finished, 1),
    clicks,
    sections,
  }
  const empty =
    !batch.views &&
    !batch.seconds &&
    !batch.finished &&
    clicks.length === 0 &&
    Object.keys(sections).length === 0
  return empty ? null : batch
}

/* ── Days ─────────────────────────────────────────────────────────── */

/**
 * The clock the counters are kept by.
 *
 * Nairobi, not UTC. The ministry's evening — when the site is busiest —
 * runs from 18:00 to 23:00 local, which UTC splits across two dates for
 * two of those hours. A day that ends at three in the morning local time
 * is not a day anybody at this desk would recognise, and every comparison
 * built on it inherits the seam.
 */
export const SITE_ZONE = 'Africa/Nairobi'

/** A day as the store names it: YYYY-MM-DD, in the site's own zone. */
export function dayKey(at: number): string {
  /* en-CA renders ISO order, which is the one format that sorts. */
  return new Date(at).toLocaleDateString('en-CA', { timeZone: SITE_ZONE })
}

/** The last `count` days ending today, oldest first. */
export function recentDays(count: number, now: number): string[] {
  const days: string[] = []
  for (let back = count - 1; back >= 0; back -= 1) {
    days.push(dayKey(now - back * 86_400_000))
  }
  return days
}

/**
 * How long a day's counters are kept.
 *
 * Long enough to compare a month against the month before it, short
 * enough that the store prunes itself rather than growing for ever. The
 * all-time totals are never dropped; it is only the day-by-day breakdown
 * that ages out.
 */
export const DAYS_KEPT = 100

/** What one day of the whole site came to. */
export interface DayTotals {
  day: string
  views: number
  seconds: number
  finished: number
}

/* ── Reading one page's counters ──────────────────────────────────── */

/** Mean engaged time on a page, in seconds. */
export const averageSecondsOf = (page: Pick<PageInsight, 'views' | 'seconds'>): number =>
  page.views > 0 ? Math.round(page.seconds / page.views) : 0

/**
 * How many of the readers who opened a piece reached the foot of it, 0–1.
 *
 * More telling than views on their own: a teaching opened two hundred
 * times and finished four is not a popular teaching, it is a headline
 * that does not survive its first paragraph.
 */
export const finishRateOf = (page: Pick<PageInsight, 'views' | 'finished'>): number =>
  page.views > 0 ? Math.min(1, page.finished / page.views) : 0
