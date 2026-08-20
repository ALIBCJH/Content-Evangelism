import { describe, expect, it } from 'vitest'
import { isLive, listPostedArticles } from '@/lib/posted'
import { GET as listArticles } from '@/app/api/v1/articles/route'
import { GET as getArticleRoute } from '@/app/api/v1/articles/[slug]/route'
import { GET as searchRoute } from '@/app/api/v1/search/route'
import { publishedArticles } from '@/lib/api/service'
import { listRealRows } from '@/lib/rows'
import { body, get } from './api/helpers'

/**
 * A teaching written at the posting desk is not on the site until a
 * senior reviewer approves it. These are the doors it must not come out
 * of before then — every one of which was, until this branch, a door with
 * nothing behind it, because everything in the store was live.
 */

describe('what counts as live', () => {
  it('holds back only what is explicitly pending', () => {
    expect(isLive({ status: 'pending' })).toBe(false)
    expect(isLive({ status: 'published' })).toBe(true)
  })

  it('treats a piece with no status as live', () => {
    /* Load-bearing: every teaching written before there was a review step
       has no status, and a missing field must not take an indexed page
       off the site. */
    expect(isLive({})).toBe(true)
    expect(isLive({ status: undefined })).toBe(true)
  })
})

describe('a pending teaching stays off the site', () => {
  const pending = { slug: 'not-yet', status: 'pending' as const }

  it('is absent from the archive the site renders', async () => {
    const rows = await listRealRows()
    expect(rows.some((row) => row.slug === pending.slug)).toBe(false)
  })

  /* The claim that matters, from the store's own side: whatever is in it,
     nothing the site is handed is pending. This holds however the store
     is filled, where naming one absent slug would not. */
  it('never hands out anything pending, whatever the store holds', async () => {
    for (const article of await listPostedArticles()) {
      expect(isLive(article), article.slug).toBe(true)
    }
  })

  it('hands the desk the queue when it asks with a key', async () => {
    const everything = await listPostedArticles({ includePending: true })
    const live = await listPostedArticles()
    expect(everything.length).toBeGreaterThanOrEqual(live.length)
    expect(everything.filter(isLive).length).toBe(live.length)
  })

  it('is absent from the public API listing', async () => {
    const payload = await body(await listArticles(get('/api/v1/articles?limit=100')))
    expect(payload.data.some((article: any) => article.slug === pending.slug)).toBe(false)
    expect(payload.pagination.total).toBe((await publishedArticles()).length)
  })

  it('is absent from search', async () => {
    const payload = await body(await searchRoute(get('/api/v1/search?q=not+yet&limit=100')))
    expect(payload.data.some((hit: any) => hit.slug === pending.slug)).toBe(false)
  })

  it('cannot be fetched by name', async () => {
    const response = await getArticleRoute(get(`/api/v1/articles/${pending.slug}`), {
      params: { slug: pending.slug },
    })
    expect(response.status).toBe(404)
    expect((await body(response)).error.code).toBe('ARTICLE_NOT_FOUND')
  })
})

describe('the public API describes no way to review', () => {
  it('offers no verdict endpoint of its own', async () => {
    const { openApiDocument } = await import('@/lib/api/openapi')
    const spec = openApiDocument()
    for (const path of Object.keys(spec.paths)) {
      expect(path).not.toContain('review')
    }
  })
})
