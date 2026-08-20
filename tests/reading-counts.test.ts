import { describe, expect, it } from 'vitest'
import { inView, progressThrough } from '@/lib/read-insight'
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
