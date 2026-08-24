'use client'

import * as React from 'react'
import type { County } from '@/lib/content'
import { altarsIn, countyNumber } from '@/lib/altars'
import { countyShapes, mapBox, projectPin } from '@/lib/county-map'

/**
 * The country, drawn.
 *
 * A list of twenty-six counties tells a reader how many there are. It
 * does not tell them the one they are standing in, which is the only
 * county they came here about. The map does that in a glance: their
 * county is either gold or it is not, and if it is, the pin is where the
 * altar actually stands.
 *
 * It is an inline SVG built from boundaries carried in this repository —
 * see `scripts/build-county-map.mjs` — rather than a map widget over
 * somebody else's tiles. Two reasons. A tile server means every reader
 * who opens this page announces themselves to a third party, on a site
 * whose contact page is a hotline and a WhatsApp number; and a widget is
 * a dependency that takes the map down with it the day it changes hands.
 * The borders of Kenya are not a live feed.
 *
 * The map is an aid, never the only way through: everything it can select
 * is also a card below it, reachable by search and by keyboard, and the
 * shapes carry the same labels the cards do.
 */
export function AltarMap({
  counties,
  matched,
  selected,
  active,
  onSelect,
  onActive,
}: {
  /** All forty-seven, so the country is whole even where we cannot direct anyone. */
  counties: County[]
  /** The counties the current search left standing. */
  matched: Set<number>
  /** The county the reader has picked, if any. */
  selected: number | null
  /** The county under the pointer or the focus ring. */
  active: number | null
  onSelect: (no: number) => void
  onActive: (no: number | null) => void
}) {
  const byNumber = React.useMemo(
    () => new Map(counties.map((county) => [county.no, county])),
    [counties],
  )

  /* Drawn last so a pin is never buried under the county next door. */
  const pins = counties.flatMap((county) =>
    (county.altars ?? []).map((altar) => ({
      county,
      key: altar.placeId,
      name: altar.name,
      ...projectPin(altar.at[0], altar.at[1]),
    })),
  )

  return (
    <svg
      viewBox={`0 0 ${mapBox.width} ${mapBox.height}`}
      className="h-auto w-full overflow-visible"
      onMouseLeave={() => onActive(null)}
    >
      <title>The counties of Kenya, with the ones holding a recorded altar in gold</title>

      {countyShapes.map((shape) => {
        const county = byNumber.get(shape.no)
        if (!county) return null

        const altars = altarsIn(county)
        const has = altars > 0
        const isMatch = matched.has(county.no)
        const isSelected = selected === county.no
        const isActive = active === county.no

        return (
          <path
            key={shape.no}
            d={shape.d}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={
              has
                ? `${county.name} — ${altars} ${altars === 1 ? 'altar' : 'altars'}`
                : `${county.name} — no altar recorded yet`
            }
            onClick={() => onSelect(county.no)}
            onMouseEnter={() => onActive(county.no)}
            onFocus={() => onActive(county.no)}
            onBlur={() => onActive(null)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              onSelect(county.no)
            }}
            className={[
              'cursor-pointer outline-none transition-[fill] duration-200',
              'stroke-card [stroke-width:1.4] focus-visible:stroke-navy focus-visible:[stroke-width:2.5]',
              isSelected
                ? 'fill-gold'
                : isActive && has
                  ? 'fill-gold/70'
                  : has && isMatch
                    ? 'fill-gold/45'
                    : has
                      ? /* Ruled out by the search, but still a place that
                           exists — dimmed rather than deleted. */
                        'fill-gold/[0.12]'
                      : isActive
                        ? 'fill-surface-3'
                        : 'fill-surface-2',
            ].join(' ')}
          >
            <title>
              {has
                ? `${countyNumber(county.no)} · ${county.name} — ${altars} ${
                    altars === 1 ? 'altar' : 'altars'
                  }`
                : `${countyNumber(county.no)} · ${county.name} — no altar recorded yet`}
            </title>
          </path>
        )
      })}

      <g aria-hidden>
        {pins.map((pin) => {
          const isSelected = selected === pin.county.no
          const isMatch = matched.has(pin.county.no)
          return (
            <circle
              key={pin.key}
              cx={pin.x}
              cy={pin.y}
              r={isSelected ? 11 : 7.5}
              className={[
                'pointer-events-none stroke-card [stroke-width:2.5] transition-all duration-200',
                isSelected || active === pin.county.no ? 'fill-navy' : 'fill-gold-ink',
                isMatch ? 'opacity-100' : 'opacity-25',
              ].join(' ')}
            />
          )
        })}
      </g>
    </svg>
  )
}
