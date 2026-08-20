'use client'

import * as React from 'react'
import Link from 'next/link'
import type { ArchiveItem } from '@/lib/archive-items'
import type { Category } from '@/lib/content'
import { byScore, score } from '@/lib/search-docs'
import { useSaved } from '@/lib/saved'
import { useReadingProgress } from '@/lib/reading-progress'
import { useSpeech } from '@/lib/speech'
import { InlineArticle } from '@/components/archive/inline-article'
import { LeadCard } from '@/components/archive/lead-card'
import { PieceCard } from '@/components/archive/piece-card'
import { TopicsRail } from '@/components/archive/topics-rail'

/**
 * The archive as a reader handles it: filtered, ordered, and marked up
 * with whatever they have put aside.
 *
 * Both happen here rather than on the server, because both are instant
 * and neither is a page a search engine should be asked to crawl: the
 * canonical archive is the whole set, newest first, which is what renders
 * before a single control is touched.
 *
 * Three orders, and each answers a question somebody actually has.
 * Newest is the default and what the page renders untouched. Most read is
 * new information rather than a rearrangement — it comes from the site's
 * own anonymous counters, and it is the only way a reader can be told
 * what the congregation is reading. Shortest is for the reader with ten
 * minutes before a service.
 *
 * An earlier version of this listing dropped its sort menu on the grounds
 * that newest was the only useful order. That was right about oldest and
 * longest, which are gone and are not coming back.
 *
 * What the box searches is what the page shows — titles, standfirsts,
 * opening lines, references and sections. It deliberately does not search
 * the full text of every teaching: that would mean shipping every body to
 * the browser, and the site already has a page that does it properly.
 *
 * Matching is scored rather than filtered, by the same rules the site-wide
 * search uses: every word typed has to appear somewhere, and where it
 * appears decides the order. Typing two words in either order finds the
 * piece that holds both, which a substring test never did.
 */

/* The rows arrive newest first; sorting here is what keeps that true of
   a filtered set as well. */
const ORDERS = {
  newest: {
    label: 'Newest',
    sort: (a: ArchiveItem, b: ArchiveItem) => b.publishedAt.localeCompare(a.publishedAt),
  },
  read: {
    label: 'Most read',
    /* Ties fall back to newest rather than to nothing, so an archive
       whose counters are empty still reads as an archive. */
    sort: (a: ArchiveItem, b: ArchiveItem) =>
      b.views - a.views || b.publishedAt.localeCompare(a.publishedAt),
  },
  shortest: {
    label: 'Shortest',
    sort: (a: ArchiveItem, b: ArchiveItem) =>
      a.readMinutes - b.readMinutes || b.publishedAt.localeCompare(a.publishedAt),
  },
} as const

type Order = keyof typeof ORDERS

export function ArchiveList({
  items,
  header,
}: {
  items: ArchiveItem[]
  /** The band's title block, rendered on the server and passed in. */
  header?: React.ReactNode
}) {
  const [query, setQuery] = React.useState('')
  const [onlySaved, setOnlySaved] = React.useState(false)
  const [order, setOrder] = React.useState<Order>('newest')
  const [topic, setTopic] = React.useState<Category | null>(null)
  const { ready, toggle, isSaved, saved } = useSaved()
  const { marks } = useReadingProgress()
  const speech = useSpeech()

  /* Every section that holds something, counted before the reader's own
     filters narrow it — the rail is the shape of the archive, not of the
     current view of it. */
  const counts = React.useMemo(() => {
    const tally = new Map<Category, number>()
    for (const item of items) tally.set(item.category, (tally.get(item.category) ?? 0) + 1)
    return Array.from(tally, ([category, count]) => ({ category, count })).sort(
      (a, b) => b.count - a.count || a.category.localeCompare(b.category)
    )
  }, [items])

  const shown = React.useMemo(() => {
    const pool = items
      .filter((item) => (onlySaved ? saved.includes(item.slug) : true))
      .filter((item) => (topic ? item.category === topic : true))
      .sort(ORDERS[order].sort)
    if (!query.trim()) return pool
    /* Ranked, not filtered: a word in a headline should bring the piece
       to the top, where the same word buried in a body should not. */
    return byScore(pool, (item) =>
      score(query, [
        { text: item.title, weight: 10 },
        { text: item.category, weight: 6 },
        { text: item.refs.join(' '), weight: 5 },
        { text: item.dek, weight: 4 },
        { text: item.dated, weight: 3 },
        { text: item.excerpt, weight: 2 },
        { text: item.haystack, weight: 1 },
      ])
    )
  }, [items, query, onlySaved, saved, topic, order])

  const [lead, ...rest] = shown

  /* Everything begun and not finished, most recent first — and still in
     the archive: a teaching withdrawn since it was read should not be
     offered back. The piece open under the card is left out, since the
     reader is in it rather than away from it. */
  const unfinished = React.useMemo(
    () =>
      marks.filter(
        (held) => held.slug !== lead?.slug && items.some((item) => item.slug === held.slug)
      ),
    [marks, items, lead?.slug]
  )
  /* The lead card leads the current view, and says which view that is.
     Calling a search result "the latest teaching" would be the one thing
     this card must not do. */
  const featured = shown.length > 0
  const kicker = query.trim()
    ? 'Best match'
    : onlySaved
      ? 'Saved for later'
      : order === 'read'
        ? 'Most read'
        : order === 'shortest'
          ? 'Shortest read'
          : topic
            ? `Latest in ${topic}`
            : 'Latest teaching'

  return (
    <>
      {/* ── The band: the search, and what is put aside ───────────── */}
      <section className="border-b border-rule bg-raised">
        <div className="shell flex flex-wrap items-center gap-x-4 gap-y-2.5 py-2.5 sm:gap-x-8">
          <label className="relative w-full min-w-0 sm:ml-auto sm:w-auto sm:min-w-[20rem] sm:max-w-[26rem] sm:flex-1">
            <span className="sr-only">Search articles and verses</span>
            <SearchIcon />
            {/* Verses, and it means it: the scorer weights each piece's
                Scripture references above its standfirst, so typing
                "Romans 6" finds the teachings that stand on it. */}
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search articles and verses"
              className="focus-ring w-full rounded-chip border border-rule bg-card py-2 pl-10 pr-4 text-[0.9375rem] text-ink-900 placeholder:text-ink-subtle"
            />
          </label>

          {/* Saved is a filter, not a page: the archive is where a reader
              left the piece, so it is where they come back to it. It
              appears only once there is something in it. */}
          {ready && saved.length > 0 && (
            <button
              type="button"
              onClick={() => setOnlySaved((current) => !current)}
              aria-pressed={onlySaved}
              data-track="filter-saved"
              className={`focus-ring shrink-0 rounded-chip px-4 py-2 text-[0.875rem] font-semibold transition-colors ${
                onlySaved
                  ? 'bg-gold text-plate-deep'
                  : 'bg-cta text-cta-ink hover:bg-cta-hover'
              }`}
            >
              Saved · <span className="tabular">{saved.length}</span>
            </button>
          )}
        </div>
      </section>

      {/* ── The archive: the rail, the lead, and the rest ──────────── */}
      <div className="shell grid gap-x-10 gap-y-10 pb-24 pt-5 lg:grid-cols-[236px_minmax(0,1fr)] xl:grid-cols-[236px_minmax(0,1fr)_340px] xl:gap-x-12">
        <aside className="lg:row-span-2 xl:row-span-1">
          <TopicsRail
            counts={counts}
            total={items.length}
            active={topic}
            onPick={setTopic}
            unfinished={unfinished}
            speech={speech}
            onPause={speech.pause}
            onResume={speech.resume}
            onStop={speech.stop}
          />
        </aside>

        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            {header}
            {/* Ordering, as three chips rather than a menu: there are only
                three, and a reader should be able to see which one is on
                without opening anything. */}
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {(Object.keys(ORDERS) as Order[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setOrder(key)}
                  aria-pressed={order === key}
                  className={`focus-ring kicker rounded-chip border px-3.5 py-2 transition-colors ${
                    order === key
                      ? 'border-navy bg-card text-navy'
                      : 'border-rule bg-card text-ink-muted hover:border-gold-pale hover:text-gold-ink'
                  }`}
                >
                  {ORDERS[key].label}
                </button>
              ))}
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-display text-xl text-ink-muted">
                {onlySaved && saved.length === 0
                  ? 'Nothing saved yet. Use \u201cSave\u201d on a piece and it waits here.'
                  : query.trim()
                    ? `Nothing in the archive matches \u201c${query.trim()}\u201d.`
                    : 'Nothing is filed under that yet.'}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setOnlySaved(false)
                    setTopic(null)
                  }}
                  className="focus-ring kicker-lg rounded-chip border border-rule bg-card px-4 py-2.5 text-navy transition-colors hover:border-gold hover:text-gold"
                >
                  Clear
                </button>
                {query.trim() && (
                  <Link
                    href={`/search?q=${encodeURIComponent(query.trim())}`}
                    className="kicker-lg text-navy transition-colors hover:text-gold"
                  >
                    Search every word →
                  </Link>
                )}
              </div>
            </div>
          ) : (
            featured &&
            lead && (
              <>
                <LeadCard
                  item={lead}
                  kicker={kicker}
                  saved={ready && isSaved(lead.slug)}
                  ready={ready}
                  onToggle={() => toggle(lead.slug)}
                  listening={speech.piece?.slug === lead.slug && speech.status === 'playing'}
                  onListen={() =>
                    speech.piece?.slug === lead.slug && speech.status === 'playing'
                      ? speech.pause()
                      : speech.play({ slug: lead.slug, title: lead.title, href: lead.href })
                  }
                />
                {/* The teaching itself, carrying on under the card once
                    the reader scrolls that far. */}
                <InlineArticle
                  piece={{
                    slug: lead.slug,
                    title: lead.title,
                    href: lead.href,
                    readMinutes: lead.readMinutes,
                  }}
                />
              </>
            )
          )}
        </div>

        {rest.length > 0 && (
          <div className="min-w-0">
            <h2 className="sr-only">The rest of the archive</h2>
            {/* Two across between sm and xl, where this column runs the
                width of the page; one in the narrow column beside the
                lead, and one on a phone. */}
            <ol className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-1">
              {rest.map((item) => (
                <li key={item.slug}>
                  <PieceCard
                    item={item}
                    saved={ready && isSaved(item.slug)}
                    ready={ready}
                    onToggle={() => toggle(item.slug)}
                  />
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </>
  )
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle sm:left-3.5"
    >
      <circle cx="10.6" cy="10.6" r="6.6" />
      <path d="m15.5 15.5 4 4" />
    </svg>
  )
}
