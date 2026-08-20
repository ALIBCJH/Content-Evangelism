import { describe, expect, it } from 'vitest'
import { BODY_MAX, DEK_MAX, TITLE_MAX, validateInput } from '@/lib/posted'
import { cleanBatch, cleanPath } from '@/lib/insight-shape'

/**
 * The bounds and the boundaries. Each of these was open until the audit
 * that produced this file, and each is the kind of thing that only shows
 * up once — so it is pinned here rather than remembered.
 */

const sound = {
  title: 'A teaching about repentance',
  dek: 'A summary long enough to pass the floor that has always been there.',
  category: 'Teachings',
  body: 'The opening paragraph of a teaching, written out at sufficient length to be accepted by the store as a real body rather than a fragment.',
}

describe('what a teaching may be', () => {
  it('accepts an ordinary one', () => {
    expect(validateInput({ ...sound }).error).toBeUndefined()
  })

  it('refuses a body that would not fit the archive', () => {
    const { error } = validateInput({ ...sound, body: 'a'.repeat(BODY_MAX + 1) })
    expect(error).toContain('may not exceed')
  })

  it('accepts a long teaching that is still a teaching', () => {
    /* Thirty thousand words is several times the longest piece here; the
       ceiling must not be so tight that real writing hits it. */
    expect(validateInput({ ...sound, body: 'word '.repeat(30_000) }).error).toBeUndefined()
  })

  it('refuses a title or a summary past its ceiling', () => {
    expect(validateInput({ ...sound, title: 'a'.repeat(TITLE_MAX + 1) }).error).toBeTruthy()
    expect(validateInput({ ...sound, dek: 'a'.repeat(DEK_MAX + 1) }).error).toBeTruthy()
  })

  it('refuses a byline or an image URL past theirs', () => {
    expect(validateInput({ ...sound, authorName: 'a'.repeat(500) }).error).toBeTruthy()
    expect(
      validateInput({ ...sound, imageUrl: `https://example.com/${'a'.repeat(600)}.jpg` }).error
    ).toBeTruthy()
  })

  it('still refuses what was always refused', () => {
    expect(validateInput({ ...sound, title: 'ab' }).error).toBeTruthy()
    expect(validateInput({ ...sound, body: 'too short' }).error).toBeTruthy()
    expect(validateInput({ ...sound, category: 'Sermons' }).error).toBeTruthy()
  })
})

describe('what the counter will count', () => {
  it('counts the pages this site actually serves', () => {
    for (const path of [
      '/',
      '/articles/why-does-god-allow-suffering',
      '/prophecies',
      '/prophecies/colombia',
      '/teachings',
      '/topics/doctrine',
      '/authors/e-omondi',
      '/search',
      '/about',
      '/docs/api',
    ]) {
      expect(cleanPath(path), path).toBe(path)
    }
  })

  it('refuses a path this site does not serve', () => {
    /* Every accepted string is a new field in the store, so an open
       counter with an open path is a store anyone may grow. */
    for (const path of ['/not-a-page', '/articles', '/wp-admin', '/a/b/c/d', '/articles/x/y']) {
      expect(cleanPath(path), path).toBeNull()
    }
  })

  it('refuses a thousand invented pages', () => {
    const invented = Array.from({ length: 1000 }, (_, i) => `/spam-${i}`)
    expect(invented.filter((path) => cleanPath(path) !== null)).toHaveLength(0)
  })

  it('still refuses what it always refused', () => {
    expect(cleanPath('https://example.com/')).toBeNull()
    expect(cleanPath('/articles/../../etc/passwd')).toBeNull()
    expect(cleanPath('/articles/<script>')).toBeNull()
  })

  it('drops a whole batch aimed at an unknown page', () => {
    expect(cleanBatch({ path: '/spam', views: 1, seconds: 60 })).toBeNull()
  })
})
