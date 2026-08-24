import * as React from 'react'
import type { County } from '@/lib/content'
import { countyViewBox } from '@/lib/altars'
import { countyShapes, projectPin } from '@/lib/county-map'

/**
 * The county, drawn close.
 *
 * The finder's map answers "which counties"; a detail page is already
 * past that question and is answering "whereabouts". So the same drawing
 * is used, zoomed to the county, with the neighbours left showing at the
 * edges — a shape floating on its own says nothing about where in the
 * country it is.
 *
 * The strokes and the pin are sized off the window rather than fixed,
 * because a viewBox a third the width of the country magnifies everything
 * in it by three: a hairline drawn for the whole map arrives here as a
 * rope.
 */
export function CountyInset({
  county,
  /** The altar this page is about — drawn larger than its neighbours. */
  at,
}: {
  county: County
  at: [number, number]
}) {
  const viewBox = countyViewBox(county.no)
  const side = Number(viewBox.split(' ')[2])
  const hairline = side / 260
  const pin = side / 34

  const here = projectPin(at[0], at[1])

  return (
    <svg viewBox={viewBox} className="h-auto w-full" role="img">
      <title>{county.name} County, and where the altar stands in it</title>

      {countyShapes.map((shape) => (
        <path
          key={shape.no}
          d={shape.d}
          strokeWidth={hairline}
          className={`stroke-card ${shape.no === county.no ? 'fill-gold/45' : 'fill-surface-2'}`}
        />
      ))}

      {/* Every altar in the county, so a reader can see at once that
          Laikipia's other one is an hour up the road. */}
      {(county.altars ?? []).map((altar) => {
        const spot = projectPin(altar.at[0], altar.at[1])
        const isHere = spot.x === here.x && spot.y === here.y
        return (
          <circle
            key={altar.placeId}
            cx={spot.x}
            cy={spot.y}
            r={isHere ? pin : pin * 0.6}
            strokeWidth={hairline * 2}
            className={isHere ? 'fill-navy stroke-card' : 'fill-gold-ink stroke-card'}
          />
        )
      })}
    </svg>
  )
}
