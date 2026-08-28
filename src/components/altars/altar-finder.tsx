'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowUpRight, MapPin, Phone, X } from 'lucide-react'
import { altarHref, counties, type County } from '@/lib/content'
import {
  altarsIn,
  awaitingCounties,
  countyBySlug,
  countyCardId,
  countyNumber,
  countySlug,
  entriesIn,
  locatedCounties,
  nearestToCounty,
  searchCounties,
  type AltarEntry,
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

  /* The county a reader picked is in the address bar, so the answer can be
     sent to somebody: /altars#samburu opens on Samburu and on what is
     nearest to it. Read after mount rather than during render — the server
     has no hash to render, and a page that disagrees with itself on the
     first paint is a page that flickers. Written with replaceState so the
     back button still leaves the page rather than walking a reader back
     through every county they tried. */
  React.useEffect(() => {
    const fromHash = () => {
      const slug = decodeURIComponent(window.location.hash.replace(/^#/, ''))
      setSelected(slug ? (countyBySlug(slug)?.no ?? null) : null)
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [])

  const remember = (no: number | null) => {
    const county = no ? counties.find((candidate) => candidate.no === no) : undefined
    const url = county ? `#${countySlug(county)}` : window.location.pathname
    window.history.replaceState(null, '', url)
  }

  const matches = React.useMemo(() => searchCounties(locatedCounties, query), [query])
  const matchedNumbers = React.useMemo(() => new Set(matches.map((c) => c.no)), [matches])

  const selectedCounty = selected ? counties.find((c) => c.no === selected) : undefined

  /* What is near whatever they picked. For a county with nothing recorded
     this is the entire answer the page has; for one with an altar it is
     the next question — how far is the one after this. */
  const nearby = React.useMemo(
    () => (selectedCounty ? nearestToCounty(selectedCounty, 3) : []),
    [selectedCounty],
  )
  const shown = selectedCounty
    ? locatedCounties.filter((county) => county.no === selectedCounty.no)
    : matches

  /* On a phone the map fills the screen and the cards are below the fold,
     so a tap that changes them silently looks like a tap that did
     nothing. The scroll is what says "the answer moved down there". */
  const select = (no: number) => {
    setSelected((current) => {
      const next = current === no ? null : no
      remember(next)
      return next
    })
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
    remember(null)
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

        {/* The picker, below `lg` only.

            The map cannot be the control on a phone. Forty-seven counties
            share about 280px of width there, so the average one is a
            33px shape and the small ones — Nairobi, Mombasa, Vihiga —
            are under twenty: well beneath the 44px a thumb needs, and no
            amount of enlarging the hit areas fixes it, because there is
            not enough room on the screen for forty-seven targets of that
            size. Making the shapes bigger would only mean tapping the
            wrong county more precisely.

            So on a phone the map goes back to being what it is good at —
            showing at a glance which counties have an altar — and the
            county is chosen from a list the platform draws itself, at the
            size the platform thinks a list should be. The shapes stay
            live for anyone who does manage to hit one, and the search
            below still finds a county by name; this is a third way in,
            not a replacement for either. */}
        <label className="relative mt-4 block lg:hidden">
          <span className="sr-only">Choose a county</span>
          {/* `appearance-none` takes the platform's own arrow off, and
              without one back the control reads as a text field that
              happens not to accept typing. The mark is what says this
              opens a list. */}
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          <select
            value={selected ?? ''}
            onChange={(event) => {
              const value = event.target.value
              if (!value) {
                clear()
                return
              }
              const no = Number(value)
              /* `select` toggles, which is right for a shape you tap
                 twice and wrong for a list you pick from — choosing the
                 county you are already on should not clear it. */
              if (no !== selected) select(no)
            }}
            className="focus-ring w-full appearance-none rounded-chip border border-rule bg-card py-3 pl-4 pr-11 text-[0.9375rem] text-ink-900"
          >
            <option value="">All counties</option>
            {counties.map((county) => {
              const altars = altarsIn(county)
              return (
                <option key={county.no} value={county.no}>
                  {county.name}
                  {altars
                    ? ` — ${altars} ${altars === 1 ? 'altar' : 'altars'}`
                    : ' — none recorded'}
                </option>
              )
            })}
          </select>
        </label>

        {/* Said differently at each width, because it is a different
            instruction: a shape to tap where tapping works, and the list
            above where it does not. */}
        <p className="mt-3 text-center font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-subtle">
          <span className="lg:hidden">Choose a county to see its altars</span>
          <span className="hidden lg:inline">Tap a county to see its altars</span>
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
                remember(null)
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

            {/* Not "we hold nothing", which is a shrug. The nearest altar
                and how far off it is, which is an answer a reader in
                Samburu can act on this Sunday. */}
            <Nearby
              items={nearby}
              title={`Nearest to ${selectedCounty.name}`}
              note={`Straight-line, from the middle of ${selectedCounty.name} — not by road.`}
            />
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

        {/* What else is within reach of the county they picked. The cards
            above answer "is there one here"; this answers the question
            underneath it, which is "and how far is the next". */}
        {selectedCounty && altarsIn(selectedCounty) > 0 && nearby.length > 0 && (
          <div className="mt-8 rounded-panel border border-rule bg-card p-6 sm:p-7">
            <Nearby
              items={nearby}
              title={`Nearest to ${selectedCounty.name}`}
              note={`Straight-line, from the middle of ${selectedCounty.name} — not by road.`}
            />
          </div>
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

/**
 * The altars nearest somewhere, with how far off each one is.
 *
 * Every row is the way to that altar's own page rather than a dead line
 * of text: a reader who has just been told the nearest altar is ninety
 * kilometres away wants the address and the number, not the name.
 */
function Nearby({
  items,
  title,
  note,
}: {
  items: { entry: AltarEntry; km: number }[]
  title: string
  note: string
}) {
  if (items.length === 0) return null

  return (
    <section className="mt-7 border-t border-rule-soft pt-6 first:mt-0 first:border-t-0 first:pt-0">
      <h3 className="mb-4 inline-block border-b-[3px] border-gold pb-2 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-navy">
        {title}
      </h3>
      <ul>
        {items.map(({ entry, km }) => (
          <li key={entry.slug} className="border-b border-rule last:border-b-0">
            <Link
              href={`/altars/${entry.slug}`}
              className="focus-ring group -mx-2 flex items-baseline gap-3 rounded-tile px-2 py-3 transition-colors hover:bg-chip-gold/50"
            >
              <span
                aria-hidden
                className="tabular w-5 shrink-0 font-apparatus text-[0.8125rem] font-bold leading-none text-gold"
              >
                {countyNumber(entry.county.no)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-apparatus text-[0.9375rem] font-semibold leading-[1.3] text-navy transition-colors group-hover:text-gold-ink">
                  {entry.county.name}
                </span>
                <span className="mt-0.5 block text-[0.8125rem] leading-[1.45] text-ink-subtle">
                  {entry.altar.name}
                </span>
              </span>
              <span className="tabular shrink-0 font-mono text-[0.6875rem] text-ink-subtle">
                {Math.round(km)} km
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.8125rem] leading-[1.6] text-ink-subtle">{note}</p>
    </section>
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
        {entriesIn(county).map(({ altar, slug }) => (
          <li
            key={altar.placeId}
            className="border-t border-rule-soft pt-4 first:border-t-0 first:pt-0"
          >
            {/* The name is the way in to the altar's own page — the one
                that carries the county, the coordinates and what else is
                near, and the one a search engine can rank for the town. */}
            <Link
              href={`/altars/${slug}`}
              className="focus-ring group block rounded-[6px]"
            >
              <span className="block text-[0.875rem] font-medium leading-[1.45] text-ink-900 underline-offset-4 group-hover:text-gold-ink group-hover:underline">
                {altar.name}
              </span>
              <span className="mt-1 block text-[0.8125rem] leading-[1.5] text-ink-subtle">
                {altar.area}
              </span>
            </Link>

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
