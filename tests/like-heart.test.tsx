import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { LikeHeart } from '@/components/like-heart'
import { ShareRow } from '@/components/share-row'

/**
 * The heart on a like button. A like used to be an outline turning into
 * a filled heart of the same colour, with nothing moving, and it was easy
 * to press without noticing anything had happened.
 */
describe('the like heart', () => {
  it('is still until it is pressed on this visit', () => {
    const html = renderToStaticMarkup(<LikeHeart liked burst={0} />)
    /* A heart liked on an earlier visit is filled and red, and nothing
       plays when the page opens. */
    expect(html).toContain('text-heart')
    expect(html).not.toContain('like-pop')
    expect(html).not.toContain('like-ring')
  })

  it('pops, rings and scatters eight small hearts when pressed', () => {
    const html = renderToStaticMarkup(<LikeHeart liked burst={1} />)
    expect(html).toContain('like-pop')
    expect(html).toContain('like-ring')
    expect(html.match(/like-spark/g) ?? []).toHaveLength(8)
  })

  it('is drawn as an outline before it is given', () => {
    const html = renderToStaticMarkup(<LikeHeart liked={false} burst={0} />)
    expect(html).not.toContain('text-heart')
    expect(html).toContain('fill="none"')
  })

  it('is hidden from a screen reader, which hears the button instead', () => {
    const html = renderToStaticMarkup(<LikeHeart liked burst={1} />)
    expect(html.startsWith('<span aria-hidden="true"')).toBe(true)
  })
})

describe('the like button at the foot of a teaching', () => {
  /* The largest thing in its row: taller than the h-10 share pills. */
  it('stands larger than the share buttons beside it', () => {
    const html = renderToStaticMarkup(<ShareRow title="A teaching" slug="a-teaching" likes={3} />)
    const like = html.match(/<button[^>]*data-track="like-article"[^>]*class="([^"]*)"/)?.[1] ?? ''
    expect(like).toContain('h-12')
    expect(html).toContain('It helped me')
  })
})
