import { describe, expect, it } from 'vitest'
import { isSlug } from '@/lib/likes'

/**
 * What may become a heart.
 *
 * The endpoint is open — a browser posts it and there is no reader to
 * authenticate — so the only thing standing between it and a store full
 * of whatever somebody felt like sending is this test on the shape of a
 * slug. It is the same discipline `/api/insight` keeps: the body may
 * name a path on this site and nothing else.
 */

describe('a slug this site could have issued', () => {
  it('takes the ones it actually issues', () => {
    expect(isSlug('what-are-the-requirements-to-enter-heaven')).toBe(true)
    expect(isSlug('why-did-jesus-have-to-die-on-the-cross')).toBe(true)
    expect(isSlug('a')).toBe(true)
  })

  it('refuses anything that is not one', () => {
    expect(isSlug('')).toBe(false)
    expect(isSlug('Why-Did-Jesus')).toBe(false)
    expect(isSlug('with spaces')).toBe(false)
    expect(isSlug('trailing-')).toBe(false)
    expect(isSlug('-leading')).toBe(false)
    expect(isSlug('double--hyphen')).toBe(false)
    expect(isSlug('under_score')).toBe(false)
  })

  it('refuses the shapes an attacker would reach for', () => {
    /* The slug becomes a field name in a hash and a key in a JSON file.
       Neither is a path, and both stay that way. */
    expect(isSlug('../../etc/passwd')).toBe(false)
    expect(isSlug('a/b')).toBe(false)
    expect(isSlug('__proto__')).toBe(false)
    expect(isSlug('constructor')).toBe(true) // a legal slug, and inert as a field
    expect(isSlug('a'.repeat(200))).toBe(false)
  })

  it('refuses anything that is not a string at all', () => {
    expect(isSlug(undefined)).toBe(false)
    expect(isSlug(null)).toBe(false)
    expect(isSlug(42)).toBe(false)
    expect(isSlug({ toString: () => 'slug' })).toBe(false)
  })
})
