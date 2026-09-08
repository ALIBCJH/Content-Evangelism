import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PieceRow } from '@/components/archive/piece-row'
import type { ArchiveItem } from '@/lib/archive-items'
import type { Category } from '@/lib/content'

/**
 * The archive row is two shapes, and which one it is depends on the
 * screen.
 *
 * On a phone it is a card: the picture across the full width of the
 * display with the headline under it. A 120px thumbnail beside a headline
 * is the right answer where there is room for two columns; on a phone it
 * is a stamp, too small to be seen and taking a fifth of the only line
 * the headline has.
 *
 * From `sm` it is the row it has always been, unchanged. These hold the
 * few classes that decide that, because they are the kind of thing a
 * later tidy-up removes without noticing what it was doing.
 */

const item = (over: Partial<ArchiveItem> = {}): ArchiveItem =>
  ({
    slug: 'a-teaching',
    href: '/articles/a-teaching',
    title: 'What is the rapture?',
    dek: 'A standfirst.',
    category: 'Teachings' as Category,
    authorName: 'The Editorial Desk',
    publishedAt: '2026-08-18T09:00:00.000Z',
    dated: 'AUG 18, 2026',
    readMinutes: 7,
    excerpt: 'An opening line.',
    refs: [],
    moreRefs: 0,
    art: { palette: 'art-dawn', mark: 'cross' },
    haystack: 'a-teaching',
    views: 0,
    likes: 0,
    shares: 0,
    thumbnail: { src: '/images/articles/x-wide.webp', alt: '', width: 1228, height: 768 },
    ...over,
  }) as ArchiveItem

describe('the archive row on a phone', () => {
  it('stacks, with the picture above the headline', () => {
    const html = renderToStaticMarkup(<PieceRow item={item()} />)
    /* Column on a phone, row from `sm`. */
    expect(html).toContain('flex flex-col')
    expect(html).toContain('sm:flex-row')
    /* The picture is painted first without leaving the headline second
       in the document — it is alt="" and a reader passes over it. */
    expect(html).toContain('order-first')
    expect(html).toContain('sm:order-none')
  })

  it('reaches both edges of the display, and only there', () => {
    const html = renderToStaticMarkup(<PieceRow item={item()} />)
    /* -mx-5 is the shell's own 20px margin at this width, cancelled. If
       the shell's mobile padding changes, this has to change with it. */
    expect(html).toContain('-mx-5')
    expect(html).toContain('sm:mx-0')
    /* Square to the screen edge on a phone; the rounded tile comes back
       with the margin. */
    expect(html).toContain('sm:rounded-md')
  })

  /* The browser picks the file off `sizes` before layout exists. Leave
     this saying 120px and every phone downloads a thumbnail and stretches
     it across the display. */
  it('tells the browser the picture is now the width of the screen', () => {
    const html = renderToStaticMarkup(<PieceRow item={item()} />)
    expect(html).toContain('(max-width: 639px) 100vw')
  })

  it('keeps the whole of the picture somebody framed', () => {
    const html = renderToStaticMarkup(<PieceRow item={item()} />)
    /* Every landscape crop in the archive is cut to 16:10. A 16:9 card
       would take the ends off all of them. */
    expect(html).toContain('aspect-[16/10]')
  })

  it('still draws the section field where a teaching has no picture', () => {
    const html = renderToStaticMarkup(<PieceRow item={item({ thumbnail: undefined })} />)
    expect(html).not.toContain('<img')
    expect(html).toContain('-mx-5')
  })
})
