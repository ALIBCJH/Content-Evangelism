import { describe, expect, it } from 'vitest'
import { inView, progressThrough } from '@/lib/read-insight'
import { minutesLeft } from '@/lib/reading-progress'
import { activeSection } from '@/lib/section-time'
import { cleanBatch, cleanPath, CLICK_LABELS } from '@/lib/insight-shape'

/**
 * The archive reads a teaching in place, so a reading has to be counted
 * against the teaching rather than against the page it sat on. These are
 * the two pure decisions behind that — is the teaching on screen, and how
 * far through it the reader is — plus the bounds the endpoint keeps.
 */

const VIEWPORT = 800

describe('progressThrough', () => {
  it('is nothing before the block is reached', () => {
    expect(progressThrough({ top: 1200, height: 4000 }, 0, VIEWPORT)).toBe(0)
  })

  it('is everything once its foot has passed the fold', () => {
    /* Block runs 0–4000 in the document; its bottom meets the bottom of
       an 800px viewport at scrollY 3200. */
    expect(progressThrough({ top: -3200, height: 4000 }, 3200, VIEWPORT)).toBe(1)
    expect(progressThrough({ top: -5000, height: 4000 }, 5000, VIEWPORT)).toBe(1)
  })

  it('runs evenly in between', () => {
    const half = progressThrough({ top: -1600, height: 4000 }, 1600, VIEWPORT)
    expect(half).toBeCloseTo(0.5, 2)
  })

  it('counts a block shorter than the window as read once reached', () => {
    expect(progressThrough({ top: 0, height: 300 }, 0, VIEWPORT)).toBe(1)
    expect(progressThrough({ top: 900, height: 300 }, 0, VIEWPORT)).toBe(0)
  })

  it('never leaves the range, whatever it is handed', () => {
    for (const scroll of [-9999, 0, 12345]) {
      const value = progressThrough({ top: 500, height: 2000 }, scroll, VIEWPORT)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(1)
    }
  })
})

describe('inView', () => {
  it('is true while any part of the teaching is on screen', () => {
    expect(inView({ top: 799, height: 100 }, VIEWPORT)).toBe(true)
    expect(inView({ top: -99, height: 100 }, VIEWPORT)).toBe(true)
  })

  it('is false above and below the window', () => {
    expect(inView({ top: 801, height: 100 }, VIEWPORT)).toBe(false)
    expect(inView({ top: -100, height: 100 }, VIEWPORT)).toBe(false)
  })
})

describe('what the endpoint will accept', () => {
  it('takes a reading counted against the teaching', () => {
    const batch = cleanBatch({
      path: '/articles/why-does-god-allow-suffering',
      views: 1,
      seconds: 240,
      finished: 1,
      clicks: [],
    })
    expect(batch).toMatchObject({
      path: '/articles/why-does-god-allow-suffering',
      views: 1,
      seconds: 240,
      finished: 1,
    })
  })

  it('counts listening, now that it is a way to take a teaching', () => {
    expect(CLICK_LABELS).toContain('listen-article')
    const batch = cleanBatch({ path: '/', clicks: ['listen-article', 'not-a-label'] })
    expect(batch?.clicks).toEqual(['listen-article'])
  })

  it('refuses a path that is not this site', () => {
    expect(cleanPath('https://example.com/articles/x')).toBeNull()
    expect(cleanPath('/articles/../../etc/passwd')).toBeNull()
    expect(cleanPath('/articles/<script>')).toBeNull()
  })

  it('caps a sitting at something a person could plausibly have read', () => {
    const batch = cleanBatch({ path: '/articles/x', seconds: 60 * 60 * 24 })
    expect(batch?.seconds).toBe(30 * 60)
  })

  it('cannot be made to count a view twice in one batch', () => {
    expect(cleanBatch({ path: '/articles/x', views: 99 })?.views).toBe(1)
    expect(cleanBatch({ path: '/articles/x', finished: 99 })?.finished).toBe(1)
  })

  it('drops a batch that says nothing', () => {
    expect(cleanBatch({ path: '/articles/x' })).toBeNull()
    expect(cleanBatch({ path: '/articles/x', views: 0, seconds: 0, clicks: [] })).toBeNull()
  })
})

describe('activeSection', () => {
  /* Marks are viewport-relative tops, in document order; the line is a
     third of the way down an 800px window. */
  const LINE = 240

  it('is nothing above the first heading', () => {
    expect(activeSection([{ id: 'one', top: 900 }], LINE)).toBeNull()
  })

  it('is the last heading the reading line has passed', () => {
    const marks = [
      { id: 'one', top: -1200 },
      { id: 'two', top: -300 },
      { id: 'three', top: 600 },
    ]
    expect(activeSection(marks, LINE)).toBe('two')
  })

  it('moves on the moment a heading crosses the line', () => {
    expect(activeSection([{ id: 'one', top: -10 }, { id: 'two', top: 241 }], LINE)).toBe('one')
    expect(activeSection([{ id: 'one', top: -10 }, { id: 'two', top: 240 }], LINE)).toBe('two')
  })

  it('credits the opening to no chapter rather than to the first', () => {
    expect(activeSection([{ id: 'one', top: 241 }, { id: 'two', top: 900 }], LINE)).toBeNull()
  })

  it('handles a teaching with no headings at all', () => {
    expect(activeSection([], LINE)).toBeNull()
  })
})

describe('section seconds at the endpoint', () => {
  it('accepts chapter timings for a teaching', () => {
    const batch = cleanBatch({
      path: '/articles/x',
      sections: { 'what-is-the-prosperity-gospel': 90, 'how-should-we-prepare': 30 },
    })
    expect(batch?.sections).toEqual({
      'what-is-the-prosperity-gospel': 90,
      'how-should-we-prepare': 30,
    })
  })

  it('refuses an anchor that is not one', () => {
    const batch = cleanBatch({
      path: '/articles/x',
      sections: { 'Drop Table': 60, '../../etc': 60, 'good-one': 60 },
    })
    expect(Object.keys(batch?.sections ?? {})).toEqual(['good-one'])
  })

  it('caps a chapter at a plausible sitting', () => {
    const batch = cleanBatch({ path: '/articles/x', sections: { one: 60 * 60 * 24 } })
    expect(batch?.sections?.one).toBe(30 * 60)
  })

  it('will not take a hundred chapters from one batch', () => {
    const many = Object.fromEntries(
      Array.from({ length: 200 }, (_, i) => [`chapter-${i}`, 10])
    )
    const batch = cleanBatch({ path: '/articles/x', sections: many })
    expect(Object.keys(batch?.sections ?? {}).length).toBeLessThanOrEqual(40)
  })

  it('drops a batch whose only content is an unusable section', () => {
    expect(cleanBatch({ path: '/articles/x', sections: { 'NOT AN ID': 60 } })).toBeNull()
  })
})

describe('the shelf a reader comes back to', () => {
  it('offers a piece back only while it is genuinely unfinished', () => {
    /* mark() keeps what is begun and not finished; the thresholds are what
       decide whether a reader is offered a teaching again. */
    const begun = { progress: 0.4, readMinutes: 10 }
    expect(minutesLeft(begun)).toBe(6)
  })

  it('never says nought minutes left', () => {
    expect(minutesLeft({ progress: 0.999, readMinutes: 10 })).toBe(1)
    expect(minutesLeft({ progress: 1, readMinutes: 1 })).toBe(1)
  })

  it('rounds what is left rather than flooring it away', () => {
    expect(minutesLeft({ progress: 0.5, readMinutes: 9 })).toBe(5)
    expect(minutesLeft({ progress: 0.1, readMinutes: 20 })).toBe(18)
  })
})
