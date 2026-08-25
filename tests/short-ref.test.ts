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
