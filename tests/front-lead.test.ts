import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { LEAD_MIN_WIDTH, canLead, pickLead, pickMostRead } from '@/lib/archive-items'
import type { ArchiveItem } from '@/lib/archive-items'
import { artSizes } from '@/lib/art-sizes'

/**
 * Which teaching is drawn large at the head of the front page.
 *
 * The rule is not "the newest one", and the difference is the whole
 * reason this file exists. Almost every landscape crop on this site is
 * the wordless region of a poster whose headline is set into the
 * picture, so a crop is as wide as the photograph happens to be — 485px
 * for the newest teaching on the archive, because column 486 is the
 * first gold pixel of a word. Run at lead size that is upscaled by a
 * fifth. A rule that only looks at the date puts it there anyway.
 */

const item = (over: Partial<ArchiveItem> = {}): ArchiveItem =>
  ({
    slug: 'a-teaching',
    href: '/articles/a-teaching',
    title: 'A teaching',
    dek: '',
    category: 'Teachings',
    authorName: '',
    publishedAt: '2026-08-18T09:00:00.000Z',
    dated: 'AUG 18, 2026',
    readMinutes: 5,
    excerpt: '',
    refs: [],
    moreRefs: 0,
    art: { palette: 'olive', icon: 'shepherd' },
    haystack: '',
    views: 0,
    likes: 0,
    shares: 0,
    ...over,
  }) as ArchiveItem

const withPicture = (width: number, slug = `w${width}`) =>
  item({ slug, thumbnail: { src: `/images/${slug}.webp`, alt: '', width, height: Math.round((width / 16) * 10) } })

describe('whether a picture can carry the lead', () => {
  it('turns down a teaching with no picture at all', () => {
    expect(canLead(item())).toBe(false)
  })

  it('turns down a picture the site cannot measure', () => {
    /* A record pointing at somewhere else entirely. It may be enormous;
       nothing here knows, and guessing puts a stretched photograph at
       the top of the page. */
    expect(canLead(item({ thumbnail: { src: 'https://example.org/x.jpg', alt: '' } }))).toBe(false)
  })

  it('turns down a crop that would have to be enlarged', () => {
    expect(canLead(withPicture(485))).toBe(false)
    expect(canLead(withPicture(648))).toBe(false)
  })

  it('takes one that is wide enough', () => {
    expect(canLead(withPicture(LEAD_MIN_WIDTH))).toBe(true)
    expect(canLead(withPicture(896))).toBe(true)
  })
})

describe('which row leads', () => {
  it('is the newest that can, not simply the newest', () => {
    /* The archive as it actually stands: the newest teaching carries a
       485px crop and the one below it carries 896px. */
    const rows = [withPicture(485, 'newest'), withPicture(896, 'cross'), withPicture(648, 'older')]
    expect(pickLead(rows)).toBe(1)
  })

  it('is -1 where nothing qualifies, and the page is a plain listing', () => {
    expect(pickLead([item(), withPicture(485), withPicture(648)])).toBe(-1)
    expect(pickLead([])).toBe(-1)
  })
})

describe('the archive as it stands', () => {
  /* Not a snapshot of what the artwork happens to be — a check that the
     rule is still reachable. If every crop on the site drops below the
     bar, the front page silently loses its lead and nothing else in the
     suite would say so. */
  it('has at least one picture big enough to lead', () => {
    const widths = Object.values(artSizes).map(([w]) => w)
    expect(Math.max(...widths)).toBeGreaterThanOrEqual(LEAD_MIN_WIDTH)
  })

  it('measures the pictures it ships', () => {
    const dir = path.join(process.cwd(), 'public', 'images', 'articles')
    const shipped = fs.readdirSync(dir).filter((f) => /\.(webp|jpe?g|png|avif)$/i.test(f))
    for (const file of shipped) expect(artSizes[`/images/articles/${file}`]).toBeDefined()
  })

  it('has a generated size table that matches the files on disk', () => {
    /* Regenerated and compared, so a re-cut crop that nobody re-ran the
       script for fails here rather than showing up as a soft lead. */
    expect(() =>
      execFileSync('node', ['scripts/art-sizes.mjs', '--check'], { stdio: 'pipe' })
    ).not.toThrow()
  })
})

describe('the teaching drawn under the lead', () => {
  const read = (slug: string, views: number) => ({ ...item({ slug }), views }) as ArchiveItem

  it('takes the busiest piece that is not the lead', () => {
    const rows = [read('lead', 99), read('quiet', 2), read('busy', 40)]
    expect(pickMostRead(rows, 0)).toBe(2)
  })

  it('never offers the lead back', () => {
    /* A front page that recommends the thing directly above it is not
       recommending anything. */
    const rows = [read('lead', 99), read('a', 5), read('b', 3)]
    expect(pickMostRead(rows, 0)).toBe(1)
  })

  it('draws nothing where nothing has been read', () => {
    /* Not a quiet week — a deployment with no counters attached, where
       every piece sits on zero. "Most read" over that is a claim. */
    expect(pickMostRead([read('a', 0), read('b', 0)], 0)).toBe(-1)
    expect(pickMostRead([], -1)).toBe(-1)
  })

  it('skips the unread ones rather than ranking them', () => {
    const rows = [read('lead', 99), read('unread', 0), read('one', 1)]
    expect(pickMostRead(rows, 0)).toBe(2)
  })

  it('gives a tie to the newer piece', () => {
    /* Items arrive newest first, so the first of an equal pair wins. */
    const rows = [read('lead', 99), read('newer', 7), read('older', 7)]
    expect(pickMostRead(rows, 0)).toBe(1)
  })
})
