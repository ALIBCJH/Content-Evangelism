'use client'

import * as React from 'react'
import { ArrowUpRight, MapPin, Phone, X } from 'lucide-react'
import { altarHref, counties, type County } from '@/lib/content'
import {
  altarsIn,
  awaitingCounties,
  countyCardId,
  countyNumber,
  locatedCounties,
  searchCounties,
} from '@/lib/altars'
import { AltarMap } from '@/components/altars/altar-map'

/**
 * The finder: the map, the search, and the cards, which are three views of
 * one question — where do I go on Sunday.
 *
 * They share their state because they are answering together. Typing
 * "mtwapa" narrows the cards and dims every county the word does not
 * belong to; picking a county off the map narrows the cards to that one
 * and drops the search, because clicking a shape means "this one" and not
 * "this one as well as whatever I typed"; hovering a card lights its pin.
 *
 * A county the ministry gathers in whose meeting place we do not hold is
 * still on the map, still clickable, and says so when it is picked. That
 * is the honest answer, and it is a better one than a shape that does
 * nothing when a reader taps their own county.
 */
export function AltarFinder() {
  const [query, setQuery] = React.useState('')
  const [selected, setSelected] = React.useState<number | null>(null)
  const [active, setActive] = React.useState<number | null>(null)
  const resultsRef = React.useRef<HTMLDivElement>(null)

  const matches = React.useMemo(() => searchCounties(locatedCounties, query), [query])
  const matchedNumbers = React.useMemo(() => new Set(matches.map((c) => c.no)), [matches])

  const selectedCounty = selected ? counties.find((c) => c.no === selected) : undefined
  const shown = selectedCounty
    ? locatedCounties.filter((county) => county.no === selectedCounty.no)
    : matches

  /* On a phone the map fills the screen and the cards are below the fold,
     so a tap that changes them silently looks like a tap that did
     nothing. The scroll is what says "the answer moved down there". */
  const select = (no: number) => {
    setSelected((current) => (current === no ? null : no))
    setQuery('')
    requestAnimationFrame(() => {
      if (window.matchMedia('(min-width: 1024px)').matches) return
      resultsRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
        block: 'start',
      })
    })
  }

  const clear = () => {
    setSelected(null)
    setQuery('')
  }

  /* What the map is showing, said in words — for a reader who cannot see
     the shape light up, and for one who can but wants the name. */
  const caption = (() => {
    const no = active ?? selected
    const county = no ? counties.find((c) => c.no === no) : undefined
    if (!county) return `${locatedCounties.length} counties with an altar recorded`
    const altars = altarsIn(county)
    return altars
      ? `${county.name} — ${altars} ${altars === 1 ? 'altar' : 'altars'}`
      : `${county.name} — no altar recorded yet`
  })()

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] lg:gap-14">
      {/* ── The map ──────────────────────────────────────────────── */}
      <div className="lg:sticky lg:top-stick">
        <div className="rounded-panel border border-rule bg-card p-5 sm:p-6">
          <AltarMap
            counties={counties}
            matched={matchedNumbers}
            selected={selected}
            active={active}
            onSelect={select}
            onActive={setActive}
          />

          <p
            aria-live="polite"
            className="mt-4 border-t border-rule-soft pt-4 text-center font-apparatus text-[0.875rem] font-semibold leading-[1.4] text-navy"
          >
            {caption}
          </p>

          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-ink-subtle">
            <li className="flex items-center gap-2">
              <span aria-hidden className="h-3 w-3 rounded-[3px] bg-gold/25 ring-1 ring-gold/40" />
              Altar recorded
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="h-3 w-3 rounded-[3px] bg-surface-2 ring-1 ring-rule" />
              Not recorded yet
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-gold" />
              An altar
            </li>
          </ul>
        </div>

        <p className="mt-3 text-center font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-subtle">
          Tap a county to see its altars
        </p>
      </div>

      {/* ── The search and the cards ─────────────────────────────── */}
      <div ref={resultsRef} className="scroll-mt-stick">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search the altars by county, name or place</span>
            <MapPin
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setSelected(null)
              }}
              placeholder="County, altar or place"
              className="focus-ring w-full rounded-chip border border-rule bg-card py-2.5 pl-10 pr-4 text-[0.9375rem] text-ink-900 placeholder:text-ink-subtle"
            />
          </label>

          {(selectedCounty || query.trim()) && (
            <button
              type="button"
              onClick={clear}
              className="focus-ring flex items-center gap-1.5 rounded-chip border border-rule px-3.5 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-navy transition-colors hover:border-gold/60 hover:text-gold-ink"
            >
              <X aria-hidden className="h-3 w-3" />
              {selectedCounty ? selectedCounty.name : 'Clear'}
            </button>
          )}
        </div>

        <p className="mb-6 text-[0.9375rem] text-ink-muted">
          {selectedCounty ? (
            <>
              Showing <span className="text-ink-900">{selectedCounty.name}</span>.
            </>
          ) : query.trim() ? (
            <>
              <span className="tabular font-mono">{shown.length}</span>{' '}
              {shown.length === 1 ? 'county' : 'counties'} for &ldquo;{query.trim()}&rdquo;
            </>
          ) : (
            <>
              <span className="tabular font-mono">{locatedCounties.length}</span> counties with a
              recorded meeting place, of Kenya&rsquo;s forty-seven.
            </>
          )}
        </p>

        {selectedCounty && altarsIn(selectedCounty) === 0 ? (
          <div className="rounded-panel border border-rule bg-card p-7">
            <p className="kicker mb-3 text-gold-ink">{countyNumber(selectedCounty.no)}</p>
            <h3 className="mb-3 font-display text-[1.5rem] leading-[1.15] text-navy">
              {selectedCounty.name}
            </h3>
            <p className="max-w-measure text-[0.9375rem] leading-[1.75] text-ink-700">
              The ministry gathers in {selectedCounty.name} too — its meeting place is not one we
              hold. We would rather say so than send anyone to a pin nobody has checked. If you
              know the altar here, tell us and it is added.
            </p>
          </div>
        ) : shown.length === 0 ? (
          <p className="rounded-panel border border-rule bg-card px-6 py-10 text-center text-[0.9375rem] text-ink-muted">
            No county matches &ldquo;{query.trim()}&rdquo;. The map holds{' '}
            {locatedCounties.length} with an altar recorded.
          </p>
        ) : (
          /* Columns rather than a grid: the cards are of different heights
             — Laikipia holds two altars, most hold one — and a grid row is
             as tall as its tallest card, which leaves holes down the page.
             Columns let each card sit directly under the last. */
          <ul className="[column-gap:1rem] sm:columns-2 xl:columns-3">
            {shown.map((county) => (
              <CountyCard
                key={county.no}
                county={county}
                onActive={setActive}
                lit={active === county.no}
              />
            ))}
          </ul>
        )}

        {/* ── The counties still to be filled in ─────────────────── */}
        {!selectedCounty && !query.trim() && (
          <div className="mt-14 border-t border-rule pt-9">
            <h2 className="kicker mb-3 text-ink-subtle">
              Counties whose meeting place is not recorded here yet
            </h2>
            <p className="mb-6 max-w-measure text-[0.9375rem] leading-[1.75] text-ink-subtle">
              The ministry gathers in these too. We would rather list them plainly than send
              anyone to a pin nobody has checked — if you know the altar in your county, tell us
              and it is added.
            </p>
            <ul className="flex flex-wrap gap-2">
              {awaitingCounties.map((county) => (
                <li key={county.no}>
                  <button
                    type="button"
                    onClick={() => select(county.no)}
                    onMouseEnter={() => setActive(county.no)}
                    onMouseLeave={() => setActive(null)}
                    className="focus-ring flex items-baseline gap-2 rounded-chip border border-rule-soft px-3.5 py-2 transition-colors hover:border-gold/60"
                  >
                    <span aria-hidden className="tabular font-mono text-[0.625rem] text-gold/70">
                      {countyNumber(county.no)}
                    </span>
                    <span className="text-[0.875rem] leading-none text-ink-500">{county.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

/** One county, and every altar it gathers at. */
function CountyCard({
  county,
  lit,
  onActive,
}: {
  county: County
  /** The map is pointing at this one. */
  lit: boolean
  onActive: (no: number | null) => void
}) {
  return (
    <li
      id={countyCardId(county.no)}
      onMouseEnter={() => onActive(county.no)}
      onMouseLeave={() => onActive(null)}
      className={`mb-4 break-inside-avoid scroll-mt-stick rounded-tile border bg-card p-5 transition-colors ${
        lit ? 'border-gold/60' : 'border-rule'
      }`}
    >
      <div className="mb-3 flex items-baseline gap-2.5">
        <span aria-hidden className="tabular font-mono text-[0.6875rem] text-gold">
          {countyNumber(county.no)}
        </span>
        <h3 className="font-display text-[1.1875rem] leading-[1.2] text-navy">{county.name}</h3>
      </div>

      {/* A county can hold more than one altar — Laikipia holds two — so
          the card lists them rather than picking one and calling it the
          county's. */}
      <ul className="space-y-4">
        {county.altars?.map((altar) => (
          <li
            key={altar.placeId}
            className="border-t border-rule-soft pt-4 first:border-t-0 first:pt-0"
          >
            <p className="text-[0.875rem] font-medium leading-[1.45] text-ink-900">{altar.name}</p>
            <p className="mt-1 text-[0.8125rem] leading-[1.5] text-ink-subtle">{altar.area}</p>

            {altar.confirmed === false && (
              <p className="mt-2 font-mono text-[0.625rem] uppercase tracking-[0.08em] text-source-label">
                Location to confirm
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <a
                href={altarHref(altar)}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring group kicker flex items-center gap-1.5 text-gold-ink"
              >
                Open in Maps
                <ArrowUpRight
                  aria-hidden
                  className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>
              {altar.phone && (
                <a
                  href={`tel:${altar.phone.replace(/\s/g, '')}`}
                  className="focus-ring flex items-center gap-1.5 font-mono text-[0.75rem] text-ink-700 underline-offset-4 hover:text-gold-ink hover:underline"
                >
                  <Phone aria-hidden className="h-3 w-3" />
                  {altar.phone}
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </li>
  )
}
