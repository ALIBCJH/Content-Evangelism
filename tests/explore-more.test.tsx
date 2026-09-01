import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ExploreMore } from '@/components/explore-more'
import type { ArchiveItem } from '@/lib/archive-items'
import type { Category } from '@/lib/content'

/**
 * The shelf at the foot of a finished teaching.
 *
 * It replaced three ruled rows of grey text, so the things worth holding
 * on to are the ones that made it worth replacing them: a picture on
 * every card, the counts drawn but not printed as noughts, and a byline
 * — the facts a reader weighs when deciding whether to stay.
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
    likes: 0,
    shares: 0,
    ...over,
  }) as ArchiveItem

describe('the shelf at the foot of a teaching', () => {
  it('stands down when there is nothing to offer', () => {
    expect(renderToStaticMarkup(<ExploreMore items={[]} />)).toBe('')
  })

  it('shows every teaching it is handed', () => {
    const html = renderToStaticMarkup(
      <ExploreMore items={['a', 'b', 'c', 'd'].map((slug) => item(slug))} />
    )
    expect(html.match(/<li /g)).toHaveLength(4)
    expect(html).toContain('Explore more')
  })

  it('names who wrote it', () => {
    const html = renderToStaticMarkup(<ExploreMore items={[item('a')]} />)
    expect(html).toContain('The Editorial Desk')
  })

  it('draws the marks always and the figures only where there are any', () => {
    const none = renderToStaticMarkup(<ExploreMore items={[item('a')]} />)
    /* Two marks, no numbers: this can be answered for. A nought would
       say it was offered and refused. */
    expect(none).toContain('said this helped them')
    expect(none).toContain('Not shared yet')
    expect(none).not.toContain('>0<')

    const some = renderToStaticMarkup(
      <ExploreMore items={[item('a', { likes: 3, shares: 2 })]} />
    )
    expect(some).toContain('>3<')
    expect(some).toContain('>2<')
  })

  it('opens with the arrows at rest, because the strip is at its start', () => {
    const html = renderToStaticMarkup(<ExploreMore items={[item('a'), item('b')]} />)
    /* Back is dead until the reader has moved; forward is live. */
    expect(html).toContain('aria-label="Back"')
    expect(html.split('aria-label="Back"')[0]).toContain('disabled')
  })
})
