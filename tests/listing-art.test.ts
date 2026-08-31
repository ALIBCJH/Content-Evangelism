import { describe, expect, it } from 'vitest'
import { bodyFigure, paletteFor, spreadFields } from '@/lib/archive-items'
import type { ArchiveItem } from '@/lib/archive-items'
import type { Category } from '@/lib/content'

/**
 * What a listing row shows where the teaching was never given artwork.
 *
 * Two of this archive's fourteen teachings have a poster attached. The
 * listing therefore lives or dies on the other two answers: a photograph
 * lifted out of the body where the writing carries one, and a field of
 * the teaching's own colour where it does not. Both have a rule that is
 * easy to get subtly wrong and impossible to notice in a diff.
 */

const figure = (src: string, w?: number, h?: number) =>
  `@figure ${src}${w ? ` ${w}x${h}` : ''} | Alt for ${src} | A caption`

describe('the picture taken out of a teaching', () => {
  it('finds nothing in a body that carries no figure', () => {
    expect(bodyFigure('Just some writing.\n\n## A heading\n\nMore writing.')).toBeUndefined()
    expect(bodyFigure(undefined)).toBeUndefined()
    expect(bodyFigure('')).toBeUndefined()
  })

  it('takes the one figure a body has, with its alt text', () => {
    const found = bodyFigure(`Opening line.\n\n${figure('/images/a.jpg', 1600, 1000)}\n\nMore.`)
    expect(found).toEqual({ src: '/images/a.jpg', alt: 'Alt for /images/a.jpg' })
  })

  it('takes the widest figure, not the first', () => {
    /* The real case this exists for: the dress-code teaching opens with a
       1635x962 landscape and follows it with a 526x701 portrait. A
       listing row is 16:10 and object-cover cuts what does not fit, so
       the portrait loses a face and the landscape loses almost nothing.
       Taking the first would be right here by luck and wrong the moment
       an editor reorders the page. */
    const body = [
      figure('/images/portrait.jpg', 526, 701),
      figure('/images/landscape.jpg', 1635, 962),
      figure('/images/square.jpg', 800, 800),
    ].join('\n\n')
    expect(bodyFigure(body)?.src).toBe('/images/landscape.jpg')
  })

  it('treats a figure with no declared size as square', () => {
    /* Better than a portrait, worse than a known landscape — so it wins
       against the first and loses to the second. */
    const overPortrait = [figure('/images/portrait.jpg', 526, 701), figure('/images/plain.jpg')]
    expect(bodyFigure(overPortrait.join('\n\n'))?.src).toBe('/images/plain.jpg')

    const underLandscape = [figure('/images/plain.jpg'), figure('/images/wide.jpg', 1635, 962)]
    expect(bodyFigure(underLandscape.join('\n\n'))?.src).toBe('/images/wide.jpg')
  })
})

describe('the colour a field is drawn in', () => {
  it('is the same every time for the same teaching', () => {
    /* Keyed on the slug rather than counted off the page, so a rebuild
       does not reshuffle the archive. */
    expect(paletteFor('what-is-repentance-and-holiness')).toBe(
      paletteFor('what-is-repentance-and-holiness')
    )
  })

  it('differs between teachings filed under the same section', () => {
    /* The whole point. Eight of fourteen pieces here are Teachings, and
       one palette per section made that eight identical olive bands —
       which is the objection that took pictures out of this listing the
       last time it had them. */
    const slugs = [
      'what-is-repentance-and-holiness',
      'why-no-trousers-makeup-or-jewellery',
      'why-do-some-people-criticize-the-ministry',
      'rapture-or-second-coming-what-is-the-difference',
    ]
    expect(new Set(slugs.map(paletteFor)).size).toBeGreaterThan(1)
  })
})

const item = (slug: string, palette: string, withPhoto = false): ArchiveItem =>
  ({
    slug,
    href: `/articles/${slug}`,
    title: slug,
    dek: '',
    category: 'Teachings' as Category,
    authorName: '',
    publishedAt: '2026-08-18T09:00:00.000Z',
    dated: 'AUG 18, 2026',
    readMinutes: 5,
    excerpt: '',
    refs: [],
    moreRefs: 0,
    art: { palette, icon: 'shepherd' },
    haystack: slug,
    views: 0,
    likes: 0,
    ...(withPhoto ? { thumbnail: { src: '/images/x.jpg', alt: '' } } : {}),
  }) as ArchiveItem

const palettes = (items: ArchiveItem[]) => items.map((i) => i.art.palette)

describe('no two fields in a row wearing the same colour', () => {
  it('leaves a column alone when nothing collides', () => {
    const given = [item('a', 'olive'), item('b', 'wine'), item('c', 'dawn')]
    expect(palettes(spreadFields(given))).toEqual(['olive', 'wine', 'dawn'])
  })

  it('moves the second of two touching fields off its neighbour', () => {
    const out = spreadFields([item('a', 'orchid'), item('b', 'orchid'), item('c', 'wine')])
    expect(out[0].art.palette).toBe('orchid')
    expect(out[1].art.palette).not.toBe('orchid')
    expect(out[2].art.palette).toBe('wine')
  })

  it('breaks a long run of one colour into alternating ones', () => {
    const run = ['a', 'b', 'c', 'd'].map((s) => item(s, 'olive'))
    const out = palettes(spreadFields(run))
    for (let i = 1; i < out.length; i++) expect(out[i]).not.toBe(out[i - 1])
  })

  it('does not count a photograph as a field, and does not recolour one', () => {
    /* A picture between two olive fields already separates them, so the
       second olive is left alone — and the photograph's own art is never
       touched, since nothing draws it. */
    const out = spreadFields([item('a', 'olive'), item('b', 'olive', true), item('c', 'olive')])
    expect(out[1].art.palette).toBe('olive')
    expect(out[1].thumbnail).toBeDefined()
    expect(out[2].art.palette).not.toBe('olive')
  })

  it('never leaves two adjacent fields matching, whatever it is handed', () => {
    const every = ['olive', 'olive', 'olive', 'wine', 'wine', 'dawn', 'dawn', 'dawn', 'dawn']
    const out = spreadFields(every.map((p, i) => item(`s${i}`, p)))
    const drawn = palettes(out)
    for (let i = 1; i < drawn.length; i++) expect(drawn[i]).not.toBe(drawn[i - 1])
  })

  it('hands back the same objects where nothing needed changing', () => {
    /* Cheap to get wrong with a map that always spreads, and it would
       throw away referential equality for every row on the page. */
    const given = [item('a', 'olive'), item('b', 'wine')]
    const out = spreadFields(given)
    expect(out[0]).toBe(given[0])
    expect(out[1]).toBe(given[1])
  })
})
