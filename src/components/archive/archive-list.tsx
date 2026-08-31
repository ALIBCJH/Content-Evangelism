'use client'

import * as React from 'react'
import Link from 'next/link'
import { spreadFields, type ArchiveItem } from '@/lib/archive-items'
import type { Category } from '@/lib/content'
import { byScore, score } from '@/lib/search-docs'
import { useSaved } from '@/lib/saved'
import { useReadingProgress } from '@/lib/reading-progress'
import { useSpeech } from '@/lib/speech'
import { AudioBar } from '@/components/archive/audio-bar'
import { ReadingHistory } from '@/components/archive/reading-history'
import { PieceRow } from '@/components/archive/piece-row'
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
 * There is no sort control. The listing has now had one twice and lost it
 * twice, and the reason it keeps going is that it was the first thing on
 * the page: three chips asking a reader to order a collection before
 * being shown anything in it. Fourteen teachings is not an archive
 * anybody needs to sort, and the front page's job is to hand over the
 * newest one.
 *
 * What "most read" offered was real — it is the only way a reader could
 * be told what the congregation is reading — and if it comes back it
 * should come back as a band of its own further down, where it is an
 * answer rather than a question.
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

/* Newest, and only newest.
   The listing offered three orders as chips above the lead — newest, most
   read, shortest — and they were the first thing on the page: three
   controls asking a reader to order a collection before they had been
   shown a single thing in it. An archive of fourteen teachings is not one
   a reader needs to sort, and a front page's job is to hand over the
   newest one.
   Sorting stays, because a filtered set has to be put back in order; what
   goes is the asking. */
const byNewest = (a: ArchiveItem, b: ArchiveItem) =>
  b.publishedAt.localeCompare(a.publishedAt)

export function ArchiveList({
  items,
  header,
  quietTitle = false,
}: {
  items: ArchiveItem[]
  /** The band's title block, rendered on the server and passed in. */
  header?: React.ReactNode
  /**
   * Read out but not drawn on a phone. True on the front page, where the
   * heading is the word "Articles" over a page of them and the card
   * below already says what it is; false on a topic or an author's page,
   * where the heading is the one thing saying whose listing this is.
   */
  quietTitle?: boolean
}) {
  const [query, setQuery] = React.useState('')
  const [onlySaved, setOnlySaved] = React.useState(false)
  const [topic, setTopic] = React.useState<Category | null>(null)
  const { ready, toggle, isSaved, saved } = useSaved()
  const { ready: marksReady, marks } = useReadingProgress()
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
      .sort(byNewest)
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
  }, [items, query, onlySaved, saved, topic])

  /* Every piece is a row, and on a wide screen one of those rows is
     drawn large. There used to be a `LeadCard` here instead — a separate
     component with a picture, a standfirst, a scripture plate and a pair
     of buttons — and it was removed because on a phone it was a screen of
     card standing between a reader and the listing they had come for.
     What is back is not that card: it is one of the rows, given the room
     to be a lead, and only from `xl`. A phone gets the same flat column
     it has had since. Listen and Save did not come back with it; they are
     on the teaching's own masthead, which is where a reader deciding to
     hear a piece read aloud actually is — see `PieceActions`. */

  /* Everything read, most recent first, and still in the archive: a
     teaching withdrawn since it was read should not be offered back. */
  const history = React.useMemo(
    () => marks.filter((held) => items.some((item) => item.slug === held.slug)),
    [marks, items]
  )

  /* The section each piece belongs to, which the mark itself does not
     carry — it holds only what is needed to get back into the reading. */
  const sections = React.useMemo(
    () => new Map(items.map((item) => [item.slug, item.category as string])),
    [items]
  )

  const rows = React.useMemo(() => spreadFields(shown), [shown])

  return (
    <>
      {/* ── The band: the search, and what is put aside ───────────── */}
      {/* Not on a phone. It is fifty-six pixels of every screen on the
          device this site is mostly read on, spent on a control that is
          already in the menu sheet as "Search the archive" — so what it
          costs a reader is one tap, and what it buys back is the top of
          the teaching. */}
      {/* Gone again at `xl`, where the masthead carries a search field of
          its own and two boxes on one screen is two answers to the same
          question. What this band held besides the box — the Saved
          filter — is reachable from the legal bar at that width. */}
      <section className="hidden border-b border-rule bg-raised sm:block xl:hidden">
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

      {/* On a phone the rail is at the foot of the page, so what is being
          read aloud is shown at the foot of the window instead. */}
      <AudioBar
        speech={speech}
        onPause={speech.pause}
        onResume={speech.resume}
        onStop={speech.stop}
      />

      {/* ── The archive: the rail, and the listing ─────────────────── */}
      {/* On a wide screen the rail is orientation, and it belongs beside
          the writing. Stacked on a phone it is a screen of furniture
          standing between a reader and the teaching, so the order is
          reversed there and restored at lg: the piece first, the rest of
          the archive second, and what the archive holds last. */}
      {/* Two tracks, at every width that has room for two: the rail, and
          the listing.

          There were three from `xl` — the rail, a lead card, and the
          archive in a 340px column beside it. Both of the other two are
          gone: the 340px column because a headline beside a 152px picture
          wraps to five lines in it, and the lead because the listing is
          one uniform column now. What is left is centred, so the slack on
          a wide screen is a margin on both sides rather than a void on
          one — the same shape the article page uses. */}
      {/* The listing widens at `xl` to make room for the second column —
          see the lead below. Below `xl` the tracks are exactly what they
          were: the rail, and a 44rem column of rows, centred. */}
      {/* The rail changes sides at `xl`, and it has to. From there the
          sections stand in a column of their own down the left of every
          page, and a topics rail beside them would be two rails on the
          same edge — four columns on a page that has room for three. So
          topics cross to the right, which is also where they belong once
          the left is navigation: the left says where you can go, the
          right says what this page holds. */}
      <div className="shell grid gap-x-10 gap-y-10 pb-24 pt-2 sm:pt-5 lg:grid-cols-[236px_minmax(0,44rem)] lg:justify-center lg:gap-x-14 xl:grid-cols-[minmax(0,1fr)_270px] xl:justify-stretch">
        <aside className="order-2 lg:order-none xl:col-start-2 xl:row-start-1">
          <TopicsRail
            counts={counts}
            total={items.length}
            active={topic}
            onPick={setTopic}
            speech={speech}
            onPause={speech.pause}
            onResume={speech.resume}
            onStop={speech.stop}
          />
        </aside>

        <div className="order-1 min-w-0 lg:order-none xl:col-start-1 xl:row-start-1">
          {/* On a phone the heading over a listing is a word describing a
              page the reader can already see, so it is read out and given
              to a crawler without being drawn — which is the whole of
              what the reader asked for here: the articles, and nothing
              above them.

              The margin belongs to the heading rather than to a wrapper
              round it: left on the wrapper it reserved twenty-four pixels
              under something that was not being drawn, and the listing
              sat that far down the page for no reason. */}
          <div
            className={
              quietTitle
                ? 'sr-only sm:not-sr-only sm:mb-6 sm:min-w-0'
                : 'mb-6 min-w-0'
            }
          >
            {header}
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
            <>
              <h2 className="sr-only">The archive</h2>
            {/* Rows with a picture each, one column at every width.

                This listing has been three things. Rows with a picture,
                two across — dropped because for most of the archive the
                picture was the section's own field, so a column of them
                was one colour repeated and every headline was a third
                narrower for it. Then a numbered index with day headings
                and no pictures at all, which fixed that by giving the eye
                nothing to land on: fourteen headlines in one grey block.

                This is the first version where the objection to the first
                one does not hold. A teaching's picture is now looked for
                in three places rather than one — its listing crop, its
                poster, and the figures inside its own body, which is
                where the only photographs most of this archive has ever
                had were sitting unseen — and where there is genuinely
                none, the field is keyed to the teaching rather than to
                its section, so eight pieces filed under Teachings are
                eight different colours instead of one olive band drawn
                eight times. See `bodyFigure` and `paletteFor`.

                One column because the archive is a chronology, and a
                chronology poured down two columns is read in the wrong
                order by anybody who reads it across. */}
              {/* One column at every width.

                  It was two from `xl` — a lead drawn large with a
                  most-read card under it, and the rest of the archive in
                  a column beside them. That is a newspaper front, and a
                  feed is a different thing: one column of equal items,
                  where the reader decides what is worth their time
                  rather than being told which piece matters most. What
                  `xl` changes now is the room, not the shape. */}
              {rows.map((item, index) => (
                /* The first row is the only picture above the fold, so
                   it is the one the browser is told to fetch first
                   rather than to lazy-load. */
                <PieceRow key={item.slug} item={item} priority={index === 0} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* The whole shelf, where a reader who has scrolled the archive
          without finding anything new will meet it. */}
      <ReadingHistory marks={history} ready={marksReady} sections={sections} />
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
