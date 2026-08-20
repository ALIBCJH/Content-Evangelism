import { describe, expect, it } from 'vitest'
import { GET as search } from '@/app/api/v1/search/route'
import { QUERY_MAX } from '@/lib/api/params'
import { body, get } from './helpers'

describe('GET /api/v1/search', () => {
  it('finds the teaching that answers the question, first', async () => {
    const payload = await body(await search(get('/api/v1/search?q=why+does+god+allow+suffering')))
    expect(payload.data[0].title).toBe('Why does God allow suffering?')
    expect(payload.data[0].type).toBe('article')
  })

  it('says why each result matched', async () => {
    const payload = await body(await search(get('/api/v1/search?q=repentance')))
    for (const hit of payload.data) {
      expect(hit.match.score).toBeGreaterThan(0)
      expect(hit.match.matchedFields.length).toBeGreaterThan(0)
    }
    /* Ranked, so an agent taking the first result takes the best one. */
    const scores = payload.data.map((hit: any) => hit.match.score)
    expect([...scores].sort((a: number, b: number) => b - a)).toEqual(scores)
  })

  it('is light: results carry no bodies', async () => {
    const payload = await body(await search(get('/api/v1/search?q=holiness')))
    for (const hit of payload.data) {
      expect(hit).not.toHaveProperty('content')
      expect(hit.links.self).toBeTruthy()
    }
  })

  /* Colombia, because the archive holds all three kinds of answer about
     it: a teaching, the record of the prophecy, and the recording it was
     delivered in. A word like "repentance" would not prove the same
     thing — it appears in the writing and nowhere in the indexed fields
     of the other two, so a single-kind result there is correct. */
  it('searches all three collections and names the kind of each', async () => {
    const payload = await body(await search(get('/api/v1/search?q=colombia&limit=100')))
    const kinds = new Set(payload.data.map((hit: any) => hit.type))
    expect(kinds).toEqual(new Set(['article', 'prophecy-record', 'teaching-recording']))
  })

  it('reaches the prophetic record, not only the writing', async () => {
    const payload = await body(await search(get('/api/v1/search?q=colombia&type=prophecy-record')))
    expect(payload.data.length).toBeGreaterThan(0)
    expect(payload.data[0].primarySource).toContain('youtube.com')
  })

  it('narrows to one kind on request', async () => {
    const payload = await body(await search(get('/api/v1/search?q=repentance&type=article&limit=100')))
    for (const hit of payload.data) expect(hit.type).toBe('article')
    expect(payload.query.types).toEqual(['article'])
  })

  it('applies article filters to the article results', async () => {
    const payload = await body(await search(get('/api/v1/search?q=holiness&type=article&category=Devotional')))
    for (const hit of payload.data) expect(hit.category.name).toBe('Devotional')
  })

  it('requires something to look for', async () => {
    const response = await search(get('/api/v1/search'))
    expect(response.status).toBe(400)
    expect((await body(response)).error.parameter).toBe('q')
  })

  it('refuses a query longer than the bound', async () => {
    const response = await search(get(`/api/v1/search?q=${'a'.repeat(QUERY_MAX + 1)}`))
    expect(response.status).toBe(400)
    expect((await body(response)).error.code).toBe('QUERY_TOO_LONG')
  })

  it('refuses an unknown type and lists the real ones', async () => {
    const response = await search(get('/api/v1/search?q=holiness&type=sermon'))
    expect(response.status).toBe(400)
    const payload = await body(response)
    expect(payload.error.parameter).toBe('type')
    expect(payload.error.allowed).toContain('prophecy-record')
  })

  it('answers a query that matches nothing with an empty page, not an error', async () => {
    const response = await search(get('/api/v1/search?q=zzzznothinghere'))
    expect(response.status).toBe(200)
    const payload = await body(response)
    expect(payload.data).toHaveLength(0)
    expect(payload.pagination.total).toBe(0)
  })
})
