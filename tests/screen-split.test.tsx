import { describe, expect, it } from 'vitest'
import { cleanBatch, screenField, screenSplitOf, type DayTotals } from '@/lib/insight-shape'
import { summarise } from '@/lib/desk-overview'
import { renderToStaticMarkup } from 'react-dom/server'
import { StretchBand } from '@/components/admin/board/bands'

/**
 * Which screen the site is read on.
 *
 * The site has never counted devices, and the counters here do not start:
 * no user agent is read, no identifier is issued, nothing is stored per
 * reader. What goes up is one of two numbers, and a number cannot be
 * walked back to a person — the same bargain everything else in
 * `insight.ts` is built on.
 *
 * What these hold to is the honesty of the split rather than its
 * arithmetic. Visits counted before this shipped carry no screen, and
 * folding them into either side would be a wrong answer presented as a
 * confident one.
 */

const day = (over: Partial<DayTotals> = {}): DayTotals => ({
  day: '2026-08-25',
  views: 0,
  seconds: 0,
  finished: 0,
  small: 0,
  large: 0,
  ...over,
})

describe('the split', () => {
  it('is drawn from the visits that actually carry a screen', () => {
    const split = screenSplitOf({ views: 100, small: 70, large: 30 })
    expect(split.counted).toBe(100)
    expect(split.smallShare).toBeCloseTo(0.7)
    expect(split.unattributed).toBe(0)
  })

  /* The whole point. A hundred visits from before the split, plus ten
     phones since, is not "9% mobile" — it is 100% of what has been
     counted, and ninety-odd visits nobody knows about. */
  it('does not let visits counted before it shipped lean the answer', () => {
    const split = screenSplitOf({ views: 110, small: 10, large: 0 })
    expect(split.counted).toBe(10)
    expect(split.smallShare).toBe(1)
    expect(split.unattributed).toBe(100)
  })

  it('offers no share at all when nothing has been counted', () => {
    const split = screenSplitOf({ views: 40, small: 0, large: 0 })
    expect(split.counted).toBe(0)
    expect(split.smallShare).toBe(0)
    expect(split.unattributed).toBe(40)
  })
})

describe('across a window at the desk', () => {
  it('adds the days up', () => {
    const summary = summarise(
      [day({ views: 10, small: 6, large: 4 }), day({ views: 10, small: 8, large: 2 })],
      []
    )
    expect(summary.screens.small).toBe(14)
    expect(summary.screens.large).toBe(6)
    expect(summary.screens.counted).toBe(20)
    expect(summary.screens.smallShare).toBeCloseTo(0.7)
  })

  it('reports the gap where a stretch straddles the day this shipped', () => {
    const summary = summarise([day({ views: 50 }), day({ views: 10, small: 7, large: 3 })], [])
    expect(summary.screens.counted).toBe(10)
    expect(summary.screens.unattributed).toBe(50)
  })
})

describe('what the counter accepts', () => {
  const view = (over: Record<string, unknown> = {}) =>
    cleanBatch({ path: '/', views: 1, ...over })

  it('takes a screen alongside a view', () => {
    expect(view({ screen: 'small' })?.screen).toBe('small')
    expect(view({ screen: 'large' })?.screen).toBe('large')
  })

  /* The two counters are a division of the views. A screen arriving on
     its own is a counter somebody could raise without a page having been
     opened. */
  it('ignores a screen sent without a view', () => {
    expect(cleanBatch({ path: '/', seconds: 30, screen: 'small' })?.screen).toBeUndefined()
  })

  it('ignores anything that is not one of the two', () => {
    expect(view({ screen: 'iphone' })?.screen).toBeUndefined()
    expect(view({ screen: 42 })?.screen).toBeUndefined()
    expect(view({ screen: '__proto__' })?.screen).toBeUndefined()
  })

  it('still records the view when the screen is nonsense', () => {
    expect(view({ screen: 'iphone' })?.views).toBe(1)
  })
})

describe('where the counters are stored', () => {
  /* Flat, with no "::" — the per-page reader splits on that, and a screen
     belongs to the site rather than to any one teaching. */
  it('is a site-wide field, not a page one', () => {
    expect(screenField('small')).toBe('screen:small')
    expect(screenField('small')).not.toContain('::')
    expect(screenField('large')).not.toContain('::')
  })
})

describe('what the board draws', () => {
  const band = (series: DayTotals[]) =>
    renderToStaticMarkup(
      <StretchBand summary={summarise(series, [])} series={series} days={30} />
    )

  it('shows the share, and both counts behind it', () => {
    const html = band([day({ views: 200, small: 160, large: 40 })])
    expect(html).toContain('80%')
    expect(html).toContain('on a phone')
    expect(html).toContain('on a wide screen')
  })

  /* Said on the page, not only in the numbers: a reader of this board
     should not have to work out why the split does not add up to the
     visits above it. */
  it('says how many visits predate the split rather than hiding them', () => {
    const html = band([day({ views: 200, small: 100, large: 50 })])
    expect(html).toContain('50')
    expect(html).toMatch(/not in\s+this split/)
  })

  it('says nothing is counted yet rather than drawing a confident zero', () => {
    const html = band([day({ views: 40 })])
    expect(html).toContain('No screens counted yet')
    expect(html).not.toContain('on a phone')
  })
})

describe('a share needs enough behind it', () => {
  const band = (series: DayTotals[]) =>
    renderToStaticMarkup(
      <StretchBand summary={summarise(series, [])} series={series} days={30} />
    )

  /* The board refuses to judge one teaching on fewer than ENOUGH_TO_JUDGE
     readings. It printed a site-wide finish rate off twenty-four visits
     all the same — a standard held to a teaching and not to itself. */
  it('gives counts rather than a finish rate below the line', () => {
    const html = band([day({ views: 24, finished: 9, small: 24 })])
    expect(html).toContain('9 of 24')
    expect(html).not.toContain('38%')
    expect(html).toMatch(/Too few yet to put a rate on/)
  })

  it('gives the rate once there is enough', () => {
    const html = band([day({ views: 200, finished: 76, small: 200 })])
    expect(html).toContain('38%')
    expect(html).not.toMatch(/Too few yet to put a rate on/)
  })

  /* One visit drew a confident "0% on a phone" with the correction in
     grey underneath — the same fault, in the same band. */
  it('holds the screen split on a handful of visits', () => {
    const html = band([day({ views: 24, small: 0, large: 1 })])
    expect(html).not.toContain('on a phone')
    expect(html).toMatch(/too few to put a share on/)
  })

  it('draws the split once enough screens are counted', () => {
    const html = band([day({ views: 200, small: 150, large: 50 })])
    expect(html).toContain('on a phone')
    expect(html).toContain('75%')
  })
})
