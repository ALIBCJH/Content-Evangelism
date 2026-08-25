import { describe, expect, it } from 'vitest'
import { shortRef } from '@/lib/short-ref'

/**
 * The citation a teaching prints under its opening quotation is written
 * for the page. Set into a hundred-pixel field on a listing row it wraps
 * to three lines and spills out of it — which is what the first draft of
 * the art did, on real teachings, in the browser.
 */
describe('a reference at thumbnail size', () => {
  it('drops the translation, which is the same on nearly every teaching', () => {
    expect(shortRef('Revelation 21:4, KJV')).toBe('Rev. 21:4')
    expect(shortRef('Exodus 28:2, NIV')).toBe('Exodus 28:2')
  })

  /* A teaching opening on two passages is still filed under the first. */
  it('keeps the first passage where a teaching opens on two', () => {
    expect(shortRef('Matthew 3:2 and Matthew 4:17, KJV')).toBe('Matt. 3:2')
  })

  it('abbreviates the books that will not fit, and leaves the short ones', () => {
    expect(shortRef('1 Thessalonians 4:16–17, KJV')).toBe('1 Thess. 4:16–17')
    expect(shortRef('Hebrews 12:14')).toBe('Hebrews 12:14')
    expect(shortRef('John 3:16')).toBe('John 3:16')
  })

  it('strips the dash the attribution line carries', () => {
    expect(shortRef('— Hebrews 12:14')).toBe('Hebrews 12:14')
  })

  it('has nothing to say about nothing', () => {
    expect(shortRef(undefined)).toBeUndefined()
    expect(shortRef('   ')).toBeUndefined()
  })
})

describe('which picture a listing row shows', () => {
  /* The ministry's artwork is a portrait poster with the headline set
     into it. Whole at the head of a teaching, unusable cropped to a
     hundred-pixel band — so a teaching may carry two pictures. */
  it('prefers the wide crop, falls back to the poster, then to nothing', async () => {
    const { toArchiveItems } = await import('@/lib/archive-items')
    const row = (over: Record<string, unknown>) =>
      ({
        slug: 's', href: '/articles/s', title: 'T', dek: 'D', category: 'Teachings',
        authorName: 'The Editorial Desk', publishedAt: '2026-08-17T09:00:00.000Z',
        readMinutes: 9, tags: [], art: { palette: 'olive', icon: 'shepherd' },
        text: '', body: 'x', ...over,
      }) as never

    const [both] = toArchiveItems([row({ imageUrl: '/poster.jpg', thumbnailUrl: '/wide.jpg' })])
    expect(both.thumbnail?.src).toBe('/wide.jpg')
    expect(both.image?.src).toBe('/poster.jpg')

    const [posterOnly] = toArchiveItems([row({ imageUrl: '/poster.jpg' })])
    expect(posterOnly.thumbnail?.src).toBe('/poster.jpg')

    const [neither] = toArchiveItems([row({})])
    expect(neither.thumbnail).toBeUndefined()
    expect(neither.image).toBeUndefined()
  })
})
