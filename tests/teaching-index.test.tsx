import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { datedGroups, longDate, ungrouped } from '@/lib/dated-groups'
import { TeachingIndex } from '@/components/archive/teaching-index'
import type { ArchiveItem } from '@/lib/archive-items'
import type { Category } from '@/lib/content'

/**
 * The archive below the lead.
 *
 * An index rather than a column of rows with a picture each — because for
 * most of this archive the picture was the section's own generated field,
 * so four rows carried four copies of one coloured band and every
 * headline was a third narrower for it. What is actually different from
 * row to row is the day a teaching went up and where it sits in the
 * archive, so those are what the column is built out of.
 */

const item = (slug: string, over: Partial<ArchiveItem> = {}): ArchiveItem =>
  ({
    slug,
    href: `/articles/${slug}`,
    title: `Teaching ${slug}`,
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
    haystack: slug,
    views: 0,
    ...over,
  }) as ArchiveItem

describe('the day a run of teachings went up', () => {
  it('reads as a person writes it', () => {
    expect(longDate('2026-08-18T09:00:00.000Z')).toBe('18 August 2026')
  })

  /* The listing is filtered and searched in the browser as well as built
     on the server, so a date formatted in the machine's own zone would be
     one date in the build and another in Nairobi — and React would swap
     the heading out on hydration. Every dateline on this site is fixed to
     UTC for that reason. */
  it('is the same date whatever zone the machine is in', () => {
    /* Late enough in the UTC day that a machine east of Greenwich would
       already call it the nineteenth. */
    expect(longDate('2026-08-18T23:30:00.000Z')).toBe('18 August 2026')
  })

  it('hands back a string it cannot read rather than "Invalid Date"', () => {
    expect(longDate('not a date')).toBe('not a date')
  })
})

describe('grouping the listing by day', () => {
  it('gathers the teachings that went up together', () => {
    const groups = datedGroups([
      item('a', { publishedAt: '2026-08-18T12:00:00.000Z' }),
      item('b', { publishedAt: '2026-08-18T09:00:00.000Z' }),
      item('c', { publishedAt: '2026-08-17T09:00:00.000Z' }),
    ])
    expect(groups.map((g) => g.date)).toEqual(['18 August 2026', '17 August 2026'])
    expect(groups[0].entries.map((e) => e.item.slug)).toEqual(['a', 'b'])
  })

  /* Numbering runs through the whole listing and counts the lead as the
     first, because what the number says is "the fourth-newest thing
     here" — a fact about the archive, not about the day it happens to
     sit under. */
  it('numbers straight through the days, starting where it is told', () => {
    const groups = datedGroups(
      [
        item('a', { publishedAt: '2026-08-18T12:00:00.000Z' }),
        item('b', { publishedAt: '2026-08-17T09:00:00.000Z' }),
        item('c', { publishedAt: '2026-08-17T08:00:00.000Z' }),
      ],
      2
    )
    expect(groups.flatMap((g) => g.entries.map((e) => e.number))).toEqual([2, 3, 4])
  })

  /* Consecutive runs rather than a tally by date. A set that is not in
     date order would otherwise be gathered into days nowhere near each
     other on the page, and the same heading would appear three times down
     one column. */
  it('only ever groups what is next to each other', () => {
    const groups = datedGroups([
      item('a', { publishedAt: '2026-08-18T12:00:00.000Z' }),
      item('b', { publishedAt: '2026-08-17T09:00:00.000Z' }),
      item('c', { publishedAt: '2026-08-18T08:00:00.000Z' }),
    ])
    expect(groups).toHaveLength(3)
  })

  it('has nothing to say about an empty listing', () => {
    expect(datedGroups([])).toEqual([])
    expect(ungrouped([])).toEqual([])
  })

  /* A set a reader has reordered by searching it is ordered by relevance,
     and a day heading over it would claim a chronology the list does not
     have. The numbering still runs: it says where each result sits in
     what is being shown. */
  it('drops the days for a listing that is not in date order', () => {
    const groups = ungrouped([item('a'), item('b')], 2)
    expect(groups).toHaveLength(1)
    expect(groups[0].date).toBeNull()
    expect(groups[0].entries.map((e) => e.number)).toEqual([2, 3])
  })
})

describe('the index as it draws', () => {
  const items = [
    item('a', { title: 'Why no trousers, makeup or jewellery?', publishedAt: '2026-08-18T12:00:00.000Z' }),
    item('b', { title: 'What is repentance and holiness?', publishedAt: '2026-08-17T09:00:00.000Z', readMinutes: 11 }),
  ]

  it('prints the day, the number, the headline and the length', () => {
    const html = renderToStaticMarkup(<TeachingIndex items={items} />)
    expect(html).toContain('18 August 2026')
    expect(html).toContain('17 August 2026')
    expect(html).toContain('02')
    expect(html).toContain('03')
    expect(html).toContain('Why no trousers, makeup or jewellery?')
    expect(html).toContain('11')
  })

  /* The whole point of the change. Below the lead there is nothing to
     look at, so a teaching without artwork is not a worse row — it is the
     same row. */
  it('carries no pictures at all', () => {
    const html = renderToStaticMarkup(
      <TeachingIndex items={[item('a', { thumbnail: { src: '/images/a.webp', alt: 'A field' } })]} />
    )
    expect(html).not.toContain('<img')
    expect(html).not.toContain('/images/a.webp')
  })

  /* The date is the heading over the run. Printing it again on every row
     would be the same fact four times down one column — which is what the
     row under it used to do. */
  it('does not repeat the date on the rows under it', () => {
    const html = renderToStaticMarkup(<TeachingIndex items={items} />)
    expect(html).not.toContain('AUG 18, 2026')
    expect(html).toContain('Teachings')
  })

  it('links each row once, to the teaching', () => {
    const html = renderToStaticMarkup(<TeachingIndex items={items} />)
    expect(html.match(/<a /g) ?? []).toHaveLength(2)
    expect(html).toContain('href="/articles/a"')
  })

  it('draws nothing when there is nothing below the lead', () => {
    expect(renderToStaticMarkup(<TeachingIndex items={[]} />)).toBe('<div class="flex flex-col gap-8"></div>')
  })
})
