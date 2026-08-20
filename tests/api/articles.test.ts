import { describe, expect, it } from 'vitest'
import { GET as listArticles } from '@/app/api/v1/articles/route'
import { GET as getArticleRoute } from '@/app/api/v1/articles/[slug]/route'
import { LIMIT_MAX } from '@/lib/api/params'
import { publishedArticles } from '@/lib/api/service'
import { body, get } from './helpers'

describe('GET /api/v1/articles', () => {
  it('lists published articles with pagination', async () => {
    const payload = await body(await listArticles(get('/api/v1/articles')))
    expect(Array.isArray(payload.data)).toBe(true)
    expect(payload.data.length).toBeGreaterThan(0)
    expect(payload.pagination).toMatchObject({
      page: 1,
      limit: 20,
      hasPreviousPage: false,
    })
    expect(payload.pagination.total).toBe((await publishedArticles()).length)
  })

  it('returns summaries, never bodies', async () => {
    const payload = await body(await listArticles(get('/api/v1/articles?limit=1')))
    const [article] = payload.data
    expect(article).toHaveProperty('title')
    expect(article).toHaveProperty('summary')
    expect(article).not.toHaveProperty('content')
    expect(article).not.toHaveProperty('body')
    /* The haystack the search box matches on is an internal field and
       must not leak: it is the whole body, lower-cased. */
    expect(article).not.toHaveProperty('text')
  })

  it('exposes the canonical page and a way back into the API', async () => {
    const payload = await body(await listArticles(get('/api/v1/articles?limit=1')))
    const [article] = payload.data
    expect(article.canonicalUrl).toMatch(/^https:\/\/.+\/articles\/[a-z0-9-]+$/)
    expect(article.links.self).toContain('/api/v1/articles/')
    expect(article.id).toBe(article.slug)
  })

  it('pages predictably', async () => {
    const first = await body(await listArticles(get('/api/v1/articles?limit=2&page=1')))
    const second = await body(await listArticles(get('/api/v1/articles?limit=2&page=2')))
    expect(first.data).toHaveLength(2)
    expect(second.pagination.page).toBe(2)
    expect(second.pagination.hasPreviousPage).toBe(true)
    const overlap = first.data.filter((a: any) => second.data.some((b: any) => b.id === a.id))
    expect(overlap).toHaveLength(0)
  })

  it('filters by category', async () => {
    const payload = await body(await listArticles(get('/api/v1/articles?category=Doctrine')))
    expect(payload.data.length).toBeGreaterThan(0)
    for (const article of payload.data) expect(article.category.name).toBe('Doctrine')
  })

  it('accepts a category written as a slug', async () => {
    const slugged = await body(await listArticles(get('/api/v1/articles?category=doctrine')))
    const written = await body(await listArticles(get('/api/v1/articles?category=Doctrine')))
    expect(slugged.pagination.total).toBe(written.pagination.total)
  })

  it('filters by tag, normalising how the tag was written', async () => {
    const plain = await body(await listArticles(get('/api/v1/articles?tag=holiness')))
    const shouted = await body(await listArticles(get('/api/v1/articles?tag=Holiness')))
    expect(plain.data.length).toBeGreaterThan(0)
    expect(shouted.pagination.total).toBe(plain.pagination.total)
    for (const article of plain.data) expect(article.tags).toContain('holiness')
  })

  it('filters by date window', async () => {
    const payload = await body(await listArticles(get('/api/v1/articles?from=2000-01-01&to=2000-12-31')))
    expect(payload.data).toHaveLength(0)
    expect(payload.pagination.total).toBe(0)
  })

  it('refuses a limit past the maximum rather than silently clamping', async () => {
    const response = await listArticles(get(`/api/v1/articles?limit=${LIMIT_MAX + 1}`))
    expect(response.status).toBe(400)
    const payload = await body(response)
    expect(payload.error.code).toBe('INVALID_PARAMETER')
    expect(payload.error.parameter).toBe('limit')
  })

  it('refuses an unknown category and says what would have worked', async () => {
    const response = await listArticles(get('/api/v1/articles?category=Sermons'))
    expect(response.status).toBe(400)
    const payload = await body(response)
    expect(payload.error.code).toBe('INVALID_PARAMETER')
    expect(payload.error.allowed).toContain('Teachings')
  })

  it.each(['page=0', 'page=-1', 'page=two', 'limit=0', 'from=yesterday', 'to=2026-13-40', 'language=sw'])(
    'refuses %s',
    async (query) => {
      const response = await listArticles(get(`/api/v1/articles?${query}`))
      expect(response.status).toBe(400)
    }
  )
})

describe('GET /api/v1/articles/{slug}', () => {
  it('returns the whole teaching, three ways', async () => {
    const rows = await publishedArticles()
    const slug = rows[0].slug
    const payload = await body(await getArticleRoute(get(`/api/v1/articles/${slug}`), { params: { slug } }))
    expect(payload.data.slug).toBe(slug)
    expect(payload.data.content.format).toBe('ministry-markup')
    expect(payload.data.content.text.length).toBeGreaterThan(100)
    expect(payload.data.content.html).toContain('<p>')
    expect(payload.data.wordCount).toBeGreaterThan(50)
  })

  it('carries the semantics a reader gets from the page', async () => {
    const payload = await body(
      await getArticleRoute(get('/api/v1/articles/why-does-god-allow-suffering'), {
        params: { slug: 'why-does-god-allow-suffering' },
      })
    )
    expect(payload.data.headings.length).toBeGreaterThan(0)
    expect(payload.data.headings[0].url).toContain('#')
    expect(payload.data.scriptureRefs.length).toBeGreaterThan(0)
    expect(payload.data.related.length).toBeGreaterThan(0)
    expect(payload.data.tags.length).toBeGreaterThan(0)
  })

  it('404s an unknown slug with a code, not a page', async () => {
    const response = await getArticleRoute(get('/api/v1/articles/nope'), { params: { slug: 'nope' } })
    expect(response.status).toBe(404)
    const payload = await body(response)
    expect(payload.error.code).toBe('ARTICLE_NOT_FOUND')
  })
})
