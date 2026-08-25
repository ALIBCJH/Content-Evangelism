import { describe, expect, it } from 'vitest'
import { FRESH_MS, isFresh, postedAgo, postedDate, postedWhen } from '@/lib/when'

/**
 * When a piece was posted, as a person reads it.
 *
 * The site printed a date everywhere, which is the right answer for
 * almost everything and the wrong one for the first day of a piece's
 * life — "25 August 2026" on the twenty-fifth of August answers nothing.
 * The desk had the opposite problem: "3 months ago", forever, which is a
 * number somebody has to convert back into a date.
 *
 * What these hold to is that the cutover is a day, that it is a cutover
 * rather than a blend, and that a date the site cannot parse degrades to
 * something readable rather than to "Invalid Date".
 */

const NOW = Date.parse('2026-08-25T10:00:00.000Z')
const ago = (ms: number) => new Date(NOW - ms).toISOString()

describe('the first day', () => {
  it('reads as recency', () => {
    expect(postedWhen(ago(3 * 3600_000), NOW)).toBe('3 hours ago')
    expect(postedWhen(ago(20 * 60_000), NOW)).toBe('20 minutes ago')
  })

  it('lasts exactly a day', () => {
    expect(isFresh(ago(FRESH_MS - 60_000), NOW)).toBe(true)
    expect(isFresh(ago(FRESH_MS + 60_000), NOW)).toBe(false)
  })

  /* A clock disagreeing with itself, not a piece posted tomorrow. It
     reads better as new than as a date in the future. */
  it('counts a timestamp slightly ahead of the clock as new', () => {
    expect(isFresh(new Date(NOW + 60_000).toISOString(), NOW)).toBe(true)
  })
})

describe('after a day', () => {
  it('becomes a date', () => {
    expect(postedWhen(ago(2 * FRESH_MS), NOW)).toBe('23 August 2026')
    expect(postedWhen('2026-03-14T08:00:00.000Z', NOW)).toBe('14 March 2026')
  })

  /* The whole point of the cutover: an old piece must never come back as
     a number the reader has to do arithmetic on. */
  it('never falls back to a count of days', () => {
    expect(postedWhen('2025-01-02T08:00:00.000Z', NOW)).not.toMatch(/ago/)
  })
})

describe('a date the site cannot read', () => {
  it('is not fresh, and is handed back rather than shown as Invalid Date', () => {
    expect(isFresh('not a date', NOW)).toBe(false)
    expect(postedDate('not a date')).toBe('not a date')
    expect(postedWhen('not a date', NOW)).toBe('not a date')
  })

  it('does not throw out of the relative form either', () => {
    expect(() => postedAgo('not a date', NOW)).not.toThrow()
  })
})
