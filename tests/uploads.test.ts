import { describe, expect, it } from 'vitest'
import { MAX_UPLOAD, UPLOAD_PREFIX, isUpload } from '@/lib/uploads'

/**
 * What counts as one of the desk's own pictures.
 *
 * `isUpload` decides whether a path is served by `app/uploads/[file]`,
 * and two things lean on the answer: structured data, which looks the
 * shape up in the store rather than on disk, and the service worker,
 * which keeps these forever because the filename is a hash of the bytes.
 * Both of those are only safe while the shape of the path is exactly
 * what this file says it is.
 */

const id = 'a'.repeat(32)

describe('recognising an uploaded picture', () => {
  it('takes a well-formed one', () => {
    expect(isUpload(`${UPLOAD_PREFIX}${id}.webp`)).toBe(true)
    expect(isUpload('/uploads/0123456789abcdef0123456789abcdef.webp')).toBe(true)
  })

  it('refuses anything that is not one', () => {
    expect(isUpload('/images/articles/why-jesus-died-on-the-cross.webp')).toBe(false)
    expect(isUpload('https://example.org/x.webp')).toBe(false)
    expect(isUpload('')).toBe(false)
  })

  it('refuses a path that only looks like one', () => {
    /* The route reads an id out of the filename and the store reads
       bytes out of the id, so anything that is not thirty-two hex
       characters and `.webp` has to fail here rather than there. */
    expect(isUpload('/uploads/../../etc/passwd')).toBe(false)
    expect(isUpload(`/uploads/${id}.webp/../secret`)).toBe(false)
    expect(isUpload(`/uploads/${'g'.repeat(32)}.webp`)).toBe(false)
    expect(isUpload(`/uploads/${'a'.repeat(31)}.webp`)).toBe(false)
    expect(isUpload(`/uploads/${id}.png`)).toBe(false)
    expect(isUpload(`/uploads/${id}`)).toBe(false)
  })
})

describe('the size a picture may arrive at', () => {
  it('is generous enough for a phone photograph and finite', () => {
    /* A current phone takes an 8-12MB photograph, and the browser shrinks
       it before sending — but the limit has to clear the unshrunk case,
       because the shrinking is an optimisation that is allowed to fail. */
    expect(MAX_UPLOAD).toBeGreaterThan(12 * 1024 * 1024)
    expect(MAX_UPLOAD).toBeLessThanOrEqual(32 * 1024 * 1024)
  })
})
