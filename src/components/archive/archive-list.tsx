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
 * All three happen here rather than on the server, because all three are
 * instant and none of them is a page a search engine should be asked to
 * crawl: the canonical archive is the whole set, newest first, which is
 * what renders before a single control is touched.
 *
 * What the box searches is what the page shows — titles, standfirsts,
 * opening lines, references and sections. It deliberately does not search
 * the full text of every teaching: that would mean shipping every body to
 * the browser, and the site already has a page that does it properly.
 */

type Sort = 'newest' | 'oldest' | 'longest' | 'shortest'

const SORTS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'longest', label: 'Longest read' },
  { value: 'shortest', label: 'Shortest read' },
]

const order = (sort: Sort) => (a: ArchiveItem, b: ArchiveItem) => {
  switch (sort) {
    case 'oldest':
      return a.publishedAt.localeCompare(b.publishedAt)
    case 'longest':
      return b.readMinutes - a.readMinutes
    case 'shortest':
      return a.readMinutes - b.readMinutes
    default:
      return b.publishedAt.localeCompare(a.publishedAt)
  }
}

export function ArchiveList({ items }: { items: ArchiveItem[] }) {
  const [query, setQuery] = React.useState('')
  const [sort, setSort] = React.useState<Sort>('newest')
  const [onlySaved, setOnlySaved] = React.useState(false)
  const { ready, toggle, isSaved, saved } = useSaved()

  const shown = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return items
      .filter((item) => (onlySaved ? saved.includes(item.slug) : true))
      .filter((item) => (q ? item.haystack.includes(q) : true))
      .sort(order(sort))
  }, [items, query, sort, onlySaved, saved])

  const [lead, ...rest] = shown
  /* The lead card is the newest piece, not whatever a sort happened to
     put first — a "shortest read" at the head of the page dressed as the
     latest teaching would be a lie told by a control. */
  const featured = sort === 'newest' && !query && !onlySaved

  return (
    <>
      {/* ── The controls ─────────────────────────────────────────── */}
      <section className="border-b border-rule bg-raised">
        <div className="shell flex flex-wrap items-center gap-x-4 gap-y-3 py-4">
          <label className="relative min-w-[min(100%,20rem)] flex-1 sm:max-w-[24rem]">
            <span className="sr-only">Search the archive</span>
            <SearchIcon />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search articles or a verse"
              className="focus-ring w-full rounded-chip border border-rule bg-card py-2.5 pl-10 pr-4 text-[0.9375rem] text-ink-900 placeholder:text-ink-subtle"
            />
          </label>

          <div className="ml-auto flex flex-wrap items-center gap-2.5">
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

            <label className="focus-within:ring-0 flex items-center gap-2 rounded-chip border border-rule bg-card pl-3.5 pr-2">
              <span className="kicker text-ink-subtle">Sort</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as Sort)}
                aria-label="Order the archive"
                className="focus-ring cursor-pointer rounded-chip bg-transparent py-2 pr-1 text-[0.875rem] font-medium text-ink-900"
              >
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="shell pb-24 pt-8">
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
            {featured && lead && (
              <FeaturedPiece
                item={lead}
                saved={ready && isSaved(lead.slug)}
                ready={ready}
                onToggle={() => toggle(lead.slug)}
              />
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

                <ol className="grid gap-5">
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
      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
    >
      <circle cx="10.6" cy="10.6" r="6.6" />
      <path d="m15.5 15.5 4 4" />
    </svg>
  )
}
