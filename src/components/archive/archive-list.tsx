'use client'

import * as React from 'react'
import Link from 'next/link'
import type { ArchiveItem } from '@/lib/archive-items'
import { useSaved } from '@/lib/saved'
import { FeaturedPiece } from '@/components/archive/featured-piece'
import { PieceRow } from '@/components/archive/piece-row'

/**
 * The archive as a reader handles it: filtered, ordered, and marked up
 * with whatever they have put aside.
 *
 * Both happen here rather than on the server, because both are instant
 * and neither is a page a search engine should be asked to crawl: the
 * canonical archive is the whole set, newest first, which is what renders
 * before a single control is touched.
 *
 * Newest first is the only order. The archive had a sort menu offering
 * oldest, longest and shortest as well, and it was answering a question
 * nobody asks of a ministry's teaching: the thing a reader wants is what
 * was published most recently, and that is what the page already does
 * before it is touched. A control whose default is the only useful
 * setting is furniture.
 *
 * What the box searches is what the page shows — titles, standfirsts,
 * opening lines, references and sections. It deliberately does not search
 * the full text of every teaching: that would mean shipping every body to
 * the browser, and the site already has a page that does it properly.
 */

/* Newest first, always. The rows arrive in this order already; sorting
   here is what keeps that true of a filtered set as well. */
const newestFirst = (a: ArchiveItem, b: ArchiveItem) =>
  b.publishedAt.localeCompare(a.publishedAt)

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
  const { ready, toggle, isSaved, saved } = useSaved()

  const shown = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return items
      .filter((item) => (onlySaved ? saved.includes(item.slug) : true))
      .filter((item) => (q ? item.haystack.includes(q) : true))
      .sort(newestFirst)
  }, [items, query, onlySaved, saved])

  const [lead, ...rest] = shown
  /* The lead card is the newest piece. Once a reader has filtered the
     set, the first row is the first match rather than the latest
     teaching, and dressing it as the latter would be a lie. */
  const featured = !query && !onlySaved

  return (
    <>
      {/* ── The band: the title, and the controls beside it ───────── */}
      <section className="border-b border-rule bg-raised">
        <div className="shell flex flex-wrap items-center gap-x-4 gap-y-4 py-5 sm:gap-x-8">
          {header}
          {/* On a phone the box sits on the title's line rather than under
              it, which costs the band a whole row. It is short there
              because it only has to be recognisable: the icon says what it
              is, and a reader typing into it sees their own words. */}
          <label className="relative ml-auto w-[9.5rem] shrink-0 sm:w-auto sm:min-w-[18rem] sm:max-w-[22rem]">
            <span className="sr-only">Search the archive</span>
            <SearchIcon />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="focus-ring w-full rounded-chip border border-rule bg-card py-2 pl-9 pr-3 text-[0.875rem] text-ink-900 placeholder:text-ink-subtle sm:py-2.5 sm:pl-10 sm:pr-4 sm:text-[0.9375rem]"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Saved is a filter, not a page: the archive is where a
                reader left the piece, so it is where they come back to
                it. It appears only once there is something in it. */}
            {ready && saved.length > 0 && (
              <button
                type="button"
                onClick={() => setOnlySaved((current) => !current)}
                aria-pressed={onlySaved}
                data-track="filter-saved"
                className={`focus-ring kicker-lg rounded-chip border px-3.5 py-2 transition-colors ${
                  onlySaved
                    ? 'border-gold bg-chip-gold text-gold-ink'
                    : 'border-rule bg-card text-ink-muted hover:border-gold-pale hover:text-gold-ink'
                }`}
              >
                Saved <span className="tabular">({saved.length})</span>
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="shell pb-24 pt-9">
        {shown.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-display text-xl text-ink-muted">
              {onlySaved && saved.length === 0
                ? 'Nothing saved yet. Use “Save for later” on a piece and it waits here.'
                : `Nothing in the archive matches “${query.trim()}”.`}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setOnlySaved(false)
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
            {/* The newest piece, twice over and one at a time. The lead
                card is a front page and needs a page to be one on; at
                phone width it filled the screen and the archive looked
                like a single article. So a phone gets the piece as a row
                marked Latest, and the wide page keeps the card. Only one
                of the two is ever rendered to a reader or to assistive
                technology, the other being display:none at that width. */}
            {featured && lead && (
              <>
                <div className="sm:hidden">
                  <PieceRow
                    item={lead}
                    latest
                    saved={ready && isSaved(lead.slug)}
                    ready={ready}
                    onToggle={() => toggle(lead.slug)}
                  />
                </div>
                <div className="hidden sm:block">
                  <FeaturedPiece
                    item={lead}
                    saved={ready && isSaved(lead.slug)}
                    ready={ready}
                    onToggle={() => toggle(lead.slug)}
                  />
                </div>
              </>
            )}

            {(featured ? rest : shown).length > 0 && (
              <>
                <h2 className="mb-5 mt-12 flex items-center gap-4">
                  <span className="shrink-0 font-display text-[1.25rem] font-medium text-navy">
                    {featured ? 'More articles' : 'Articles'}
                  </span>
                  <span
                    aria-hidden
                    className="h-px flex-1 bg-gradient-to-r from-gold-pale to-rule"
                  />
                  <span className="kicker shrink-0 text-ink-subtle">
                    <span className="tabular">{(featured ? rest : shown).length}</span>{' '}
                    {(featured ? rest : shown).length === 1 ? 'piece' : 'pieces'}
                  </span>
                </h2>

                {/* Two across from `2xl`. One column on a 1460px page is a
                    card with half a metre of nothing beside it; below that
                    width two would each be too narrow to set a headline
                    and a pulled verse side by side. */}
                <ol className="grid gap-5 2xl:grid-cols-2">
                  {(featured ? rest : shown).map((item) => (
                    <li key={item.slug}>
                      <PieceRow
                        item={item}
                        saved={ready && isSaved(item.slug)}
                        ready={ready}
                        onToggle={() => toggle(item.slug)}
                      />
                    </li>
                  ))}
                </ol>
              </>
            )}
          </>
        )}
      </section>
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
