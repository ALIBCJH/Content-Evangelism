import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PieceRow } from '@/components/archive/piece-row'
import type { ArchiveItem } from '@/lib/archive-items'
import type { Category } from '@/lib/content'

/**
 * The archive card: the full width of a phone, and two across from `sm`
 * (the grid itself is `archive-list`'s). Picture on top at every width.
 *
 * What follows was first written for a card on a phone and a row above
 * it, and the phone half of it still holds exactly.
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
    expect(html).toContain('flex flex-col')
    /* The picture is painted first without leaving the headline second
       in the document — it is alt="" and a reader passes over it. */
    expect(html).toContain('order-first')
  })

  /* It is a card at every width now, not a card on a phone and a row
     from `sm`. The two classes that turned it back into a row are gone,
     and if either returns the desktop listing is a row again. */
  it('keeps the picture on top at every width', () => {
    const html = renderToStaticMarkup(<PieceRow item={item()} />)
    expect(html).not.toContain('sm:flex-row')
    expect(html).not.toContain('sm:order-none')
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

  /* The card is one target, and the picture is more than half of it.
     Both the overlay and the picture are positioned, and the picture comes
     later in the document — it is only visually first, by `order-first` —
     so without a z-index it paints over the link and swallows every press.
     That was live, and measured: a tap on the picture landed on the `img`.
     The bleed matters for the same reason: the picture runs to both edges
     of the screen and the overlay has to follow it there. */
  it('is pressable across the whole of itself, picture and bleed included', () => {
    const html = renderToStaticMarkup(<PieceRow item={item()} />)
    const overlay = html.match(/<span aria-hidden="true" class="(absolute[^"]*)"/)?.[1] ?? ''
    expect(overlay, 'the stretched link overlay').toContain('z-10')
    expect(overlay).toContain('-inset-x-5')
    expect(overlay).toContain('inset-y-0')
    /* And back inside the margin from `sm`, where the picture is a
       thumbnail rather than a bleed. */
    expect(overlay).toContain('sm:inset-x-0')
  })

  /* Nothing else in the row is interactive — the heart and the share mark
     are counts, not controls — so an overlay across the whole card takes
     no press away from anything. If a real control is ever added to a row,
     this breaks and should. */
  it('covers nothing a reader could otherwise press', () => {
    const html = renderToStaticMarkup(<PieceRow item={item({ likes: 3, shares: 2 })} />)
    expect(html).not.toContain('<button')
    expect(html.match(/<a /g) ?? []).toHaveLength(1)
  })

  it('still draws the section field where a teaching has no picture', () => {
    const html = renderToStaticMarkup(<PieceRow item={item({ thumbnail: undefined })} />)
    expect(html).not.toContain('<img')
    expect(html).toContain('-mx-5')
  })
})

describe('a desktop picture, when one has been made', () => {
  /* The phone file keeps its name — four live records are held in the
     store and point at it, and only the desk can repoint them — so the
     desktop file is found by rule rather than by a field on the record. */
  it('is named after the phone picture', async () => {
    const { desktopVariant } = await import('@/lib/archive-items')
    expect(desktopVariant('/images/articles/rapture-of-the-church-wide.webp')).toBe(
      '/images/articles/rapture-of-the-church-desktop.webp'
    )
    /* The one teaching whose single picture does both jobs. */
    expect(desktopVariant('/images/articles/holiness-puzzle.webp')).toBe(
      '/images/articles/holiness-puzzle-desktop.webp'
    )
    /* A picture the site does not ship has no sibling to find. */
    expect(desktopVariant('https://example.com/x-wide.webp')).toBeUndefined()
  })

  /* Until a desktop file is supplied, nothing about the card changes. */
  it('leaves the card exactly as it was when there is none', () => {
    const html = renderToStaticMarkup(<PieceRow item={item()} />)
    expect(html).not.toContain('<picture')
    expect(html).not.toContain('-desktop')
  })

  it('sends a wide screen the desktop file and a phone the phone file', () => {
    const html = renderToStaticMarkup(
      <PieceRow
        item={item({
          thumbnail: {
            src: '/images/articles/x-wide.webp',
            alt: '',
            width: 1228,
            height: 768,
            desktop: { src: '/images/articles/x-desktop.webp', width: 1600, height: 1000 },
          },
        })}
      />
    )
    expect(html).toContain('<picture')
    /* The source is the desktop's, and only from `sm` up. */
    expect(html).toMatch(/<source media="\(min-width: 640px\)" srcSet="[^"]*x-desktop\.webp/)
    /* The fallback — what a phone gets — is still the phone's. */
    expect(html).toMatch(/<img[^>]*src="[^"]*x-wide\.webp/)
    /* One picture, not two hidden by CSS: a phone must not fetch both. */
    expect(html.match(/<img /g) ?? []).toHaveLength(1)
  })
})
