import {
  SITE_PARTS,
  averageSecondsOf,
  finishRateOf,
  sitePart,
  screenSplitOf,
  type ClickLabel,
  type DayTotals,
  type PageInsight,
  type SitePart,
} from '@/lib/insight-shape'

/**
 * The board the review desk opens on.
 *
 * Three separate things are known here and were never in one place: what
 * the desk has to decide, what readers did, and whether the machinery is
 * sound. Each lived on its own page, and the effect was that nobody
 * looked at any of them — the counters were behind a key on a page you
 * had to know existed, and the fact that twelve teachings were on the
 * site unverified was a grey word at the end of a row.
 *
 * Everything here is a pure function of data handed in. The store, the
 * environment and the clock stay in the route, so what the desk is shown
 * can be worked out on a table and checked.
 *
 * One word is used carefully throughout, because the site makes a promise
 * about it: **visits**, never visitors. Nothing is stored per reader —
 * see insight.ts — so one reader opening a teaching three times and three
 * readers opening it once are the same number here, and there is no
 * honest way to tell them apart. A board that said "people" would be
 * inventing a figure the site deliberately refuses to collect.
 */

export interface DeskArticle {
  slug: string
  title: string
  category: string
  authorName: string
  publishedAt: string
  readMinutes: number
  status?: 'pending' | 'published'
  verified?: boolean
  submittedAt?: string
  review?: { note: string; at: string }
}

export interface DeskQuestion {
  status: string
}

/* ── What needs a decision ────────────────────────────────────────── */

export interface DeskNeeds {
  /** Written and submitted, waiting for somebody to read it. */
  waiting: number
  /**
   * On the site, and never checked against the ministry's own teaching.
   *
   * The one number on this board that is a debt rather than a
   * measurement. Everything published before there was a review step
   * carries no verified mark, which is correct — nobody checked it — and
   * being correct is exactly why it should be visible rather than filed
   * as a grey label at the end of a row.
   */
  unverified: number
  /** Sent back with a reason, and not yet reworked. */
  sentBack: number
  /** Readers waiting on an answer. */
  unanswered: number
}

export function needsAttention(
  articles: DeskArticle[],
  questions: DeskQuestion[]
): DeskNeeds {
  return {
    waiting: articles.filter((a) => a.status === 'pending' && !a.review).length,
    unverified: articles.filter((a) => a.status !== 'pending' && !a.verified).length,
    sentBack: articles.filter((a) => a.status === 'pending' && Boolean(a.review)).length,
    unanswered: questions.filter((q) => q.status === 'new').length,
  }
}

/* ── Every piece, one row ─────────────────────────────────────────── */

export interface PieceRow extends DeskArticle {
  /** Where a reader reads it, and the key the counters are kept under. */
  path: string
  /** Over the window being shown. */
  views: number
  finished: number
  /** 0–1. */
  finishRate: number
  /** Mean engaged seconds per visit. */
  averageSeconds: number
  /** Total engaged seconds, for ranking by attention rather than by door. */
  seconds: number
  /** Since the beginning, whatever window is being shown. */
  viewsEver: number
  /** Engaged seconds by heading anchor, most-held first. */
  sections: { id: string; seconds: number; share: number }[]
}

const pathOf = (slug: string) => `/articles/${slug}`

function sectionsOf(page: PageInsight | undefined): PieceRow['sections'] {
  const entries = Object.entries(page?.sections ?? {})
  const total = entries.reduce((sum, [, seconds]) => sum + seconds, 0)
  return entries
    .map(([id, seconds]) => ({ id, seconds, share: total > 0 ? seconds / total : 0 }))
    .sort((a, b) => b.seconds - a.seconds)
}

/**
 * The articles joined to what readers did with them.
 *
 * Ordered by engaged seconds rather than by views, because the question
 * the desk is really asking is which teaching held somebody — and a
 * headline that is opened and abandoned outranks a teaching that was read
 * end to end on any count of doors.
 */
export function pieceRows(
  articles: DeskArticle[],
  windowPages: PageInsight[],
  everPages: PageInsight[]
): PieceRow[] {
  const inWindow = new Map(windowPages.map((page) => [page.path, page]))
  const ever = new Map(everPages.map((page) => [page.path, page]))

  return articles
    .map((article) => {
      const path = pathOf(article.slug)
      const page = inWindow.get(path)
      const counted: PageInsight = page ?? {
        path,
        views: 0,
        seconds: 0,
        finished: 0,
        clicks: {},
        sections: {},
      }
      return {
        ...article,
        path,
        views: counted.views,
        finished: counted.finished,
        seconds: counted.seconds,
        finishRate: finishRateOf(counted),
        averageSeconds: averageSecondsOf(counted),
        viewsEver: ever.get(path)?.views ?? 0,
        sections: sectionsOf(ever.get(path)),
      }
    })
    .sort((a, b) => b.seconds - a.seconds || b.views - a.views)
}

/* ── What is worth saying about those rows ────────────────────────── */

/**
 * Enough visits for a rate to mean anything.
 *
 * A piece opened three times and finished none is not a finding, it is
 * three people. Below this the finish rate is noise and is not used to
 * accuse a teaching of anything.
 */
export const ENOUGH_TO_JUDGE = 20

/** Opened often, finished rarely — something is wrong with the piece. */
export const DEAD_END_RATE = 0.25

export function deadEnds(rows: PieceRow[]): PieceRow[] {
  return rows
    .filter((row) => row.status !== 'pending')
    .filter((row) => row.views >= ENOUGH_TO_JUDGE && row.finishRate < DEAD_END_RATE)
    .sort((a, b) => a.finishRate - b.finishRate)
}

/**
 * On the site and barely opened.
 *
 * More useful than a top ten, which tells the desk what it already knows.
 * Judged on all-time views rather than the window, so a teaching that had
 * its readers last year is not called unread this week.
 */
export function unread(rows: PieceRow[], floor = 5): PieceRow[] {
  return rows
    .filter((row) => row.status !== 'pending' && row.viewsEver <= floor)
    .sort((a, b) => a.viewsEver - b.viewsEver)
}

/** The section filter's "no filter" state, named so it cannot collide
 *  with a real category. */
export const EVERY_SECTION = '\u0000all'

/**
 * The rows a filter leaves standing.
 *
 * Title, byline and section are searched together rather than separately:
 * somebody looking for "the prosperity gospel piece Simon wrote" should
 * find it by either half, and a desk that makes you pick which field you
 * are searching is one you search twice.
 */
export function narrow(
  rows: PieceRow[],
  needle: string,
  section: string,
  /**
   * Only the teachings on the site that nobody has checked yet.
   *
   * Composed with the other two rather than replacing them, so a
   * reviewer can work through the unchecked pieces of one section. It is
   * the working list for an archive that was published before there was
   * a review desk to publish it through.
   */
  onlyUnchecked = false
): PieceRow[] {
  const wanted = needle.trim().toLowerCase()
  return rows.filter((row) => {
    if (onlyUnchecked && (row.status === 'pending' || row.verified)) return false
    if (section !== EVERY_SECTION && row.category !== section) return false
    if (!wanted) return true
    return `${row.title}\n${row.authorName}\n${row.category}`.toLowerCase().includes(wanted)
  })
}

/** How many live teachings nobody has checked yet. */
export const uncheckedCount = (rows: PieceRow[]): number =>
  rows.filter((row) => row.status !== 'pending' && !row.verified).length

/** How many pieces sit in each section, largest first. */
export function sectionCounts(rows: PieceRow[]): { name: string; n: number }[] {
  const counts = new Map<string, number>()
  for (const row of rows) counts.set(row.category, (counts.get(row.category) ?? 0) + 1)
  return Array.from(counts, ([name, n]) => ({ name, n })).sort(
    (a, b) => b.n - a.n || a.name.localeCompare(b.name)
  )
}

/* ── Where attention goes ─────────────────────────────────────────── */

export interface PartRow {
  part: SitePart
  views: number
  seconds: number
  /** This part's share of all engaged time, 0–1. */
  share: number
}

export function byPart(pages: PageInsight[]): PartRow[] {
  const totals = new Map<SitePart, { views: number; seconds: number }>()
  for (const page of pages) {
    const part = sitePart(page.path)
    const held = totals.get(part) ?? { views: 0, seconds: 0 }
    held.views += page.views
    held.seconds += page.seconds
    totals.set(part, held)
  }

  const allSeconds = Array.from(totals.values()).reduce((sum, held) => sum + held.seconds, 0)
  return SITE_PARTS.map((part) => {
    const held = totals.get(part) ?? { views: 0, seconds: 0 }
    return {
      part,
      views: held.views,
      seconds: held.seconds,
      share: allSeconds > 0 ? held.seconds / allSeconds : 0,
    }
  })
    .filter((row) => row.views > 0 || row.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds)
}

/** Every counted click across the site, busiest first. */
export function clickTotals(pages: PageInsight[]): { label: ClickLabel; count: number }[] {
  const totals = new Map<ClickLabel, number>()
  for (const page of pages) {
    for (const [label, count] of Object.entries(page.clicks)) {
      totals.set(label as ClickLabel, (totals.get(label as ClickLabel) ?? 0) + (count ?? 0))
    }
  }
  return Array.from(totals, ([label, count]) => ({ label, count })).sort(
    (a, b) => b.count - a.count
  )
}

/* ── The window, and the one before it ────────────────────────────── */

export interface WindowSummary {
  visits: number
  seconds: number
  finished: number
  /** 0–1 across everything counted in the window. */
  finishRate: number
  /** Change against the window before, 0.12 being twelve per cent up. */
  change: { visits: number | null; seconds: number | null }
  /**
   * Which screen the site was read on across the window.
   *
   * `counted` is what the split is actually drawn from, and it is not
   * the same as `visits`: every visit recorded before the screen was
   * counted has no screen, and `unattributed` is how many. The desk
   * shows that number rather than folding it into one side, because a
   * split that quietly counts old visits as desktop is a wrong answer
   * presented as a confident one.
   */
  screens: ReturnType<typeof screenSplitOf>
}

function sum(series: DayTotals[]): {
  visits: number
  seconds: number
  finished: number
  small: number
  large: number
} {
  return series.reduce(
    (totals, day) => ({
      visits: totals.visits + day.views,
      seconds: totals.seconds + day.seconds,
      finished: totals.finished + day.finished,
      small: totals.small + day.small,
      large: totals.large + day.large,
    }),
    { visits: 0, seconds: 0, finished: 0, small: 0, large: 0 }
  )
}

/**
 * A change against nothing is not a change.
 *
 * A site with no visits last week and forty this week has not grown by
 * any percentage — it has started. Returning null says so, and the board
 * prints nothing rather than an infinity or a confident "+∞%".
 */
function shift(now: number, before: number): number | null {
  return before > 0 ? (now - before) / before : null
}

export function summarise(series: DayTotals[], previous: DayTotals[]): WindowSummary {
  const now = sum(series)
  const before = sum(previous)
  return {
    visits: now.visits,
    seconds: now.seconds,
    finished: now.finished,
    finishRate: now.visits > 0 ? Math.min(1, now.finished / now.visits) : 0,
    change: {
      visits: shift(now.visits, before.visits),
      seconds: shift(now.seconds, before.seconds),
    },
    screens: screenSplitOf({ views: now.visits, small: now.small, large: now.large }),
  }
}

/* ── Is the machinery sound ───────────────────────────────────────── */

export interface DeskHealth {
  /** Whether a store is attached at all. Without one, publishing fails. */
  storeAttached: boolean
  /** Whether the review desk has a key of its own. */
  separateReviewKey: boolean
  /** Whether anything has been counted yet. */
  countingWorks: boolean
  live: number
  pending: number
  /** Altars given, out of the counties there are. */
  altarsPlaced: number
  countiesTotal: number
  /** The most recent thing to go on the site. */
  lastPublishedAt?: string
}

/** A plain reading of the health, worst first, for the strip at the foot. */
export function healthNotes(health: DeskHealth): { level: 'bad' | 'warn' | 'good'; note: string }[] {
  const notes: { level: 'bad' | 'warn' | 'good'; note: string }[] = []

  notes.push(
    health.storeAttached
      ? { level: 'good', note: 'Article store attached.' }
      : {
          level: 'bad',
          note: 'No article store attached — publishing will fail. Attach Upstash Redis in Vercel.',
        }
  )

  notes.push(
    health.separateReviewKey
      ? { level: 'good', note: 'The review desk has its own key.' }
      : {
          level: 'warn',
          note: 'REVIEW_TOKEN is unset, so the posting key also approves. Whoever writes can publish their own work.',
        }
  )

  notes.push(
    health.countingWorks
      ? { level: 'good', note: 'Readers are being counted.' }
      : { level: 'warn', note: 'Nothing counted yet. Either nobody has visited, or the counter is not reporting.' }
  )

  if (health.altarsPlaced < health.countiesTotal) {
    notes.push({
      level: 'warn',
      note: `${health.countiesTotal - health.altarsPlaced} of ${health.countiesTotal} counties have no altar listed.`,
    })
  }

  return notes.sort((a, b) => {
    const rank = { bad: 0, warn: 1, good: 2 }
    return rank[a.level] - rank[b.level]
  })
}
