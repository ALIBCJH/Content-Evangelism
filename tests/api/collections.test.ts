import { describe, expect, it } from 'vitest'
import { GET as listCategories } from '@/app/api/v1/categories/route'
import { GET as listTags } from '@/app/api/v1/tags/route'
import { GET as listAuthors } from '@/app/api/v1/authors/route'
import { GET as listProphecies } from '@/app/api/v1/prophecies/route'
import { GET as getProphecyRoute } from '@/app/api/v1/prophecies/[id]/route'
import { GET as listTeachings } from '@/app/api/v1/teachings/route'
import { GET as getTeachingRoute } from '@/app/api/v1/teachings/[id]/route'
import { prophecyRecords } from '@/lib/prophecies'
import { teachingRecordings } from '@/lib/teachings'
import { body, get } from './helpers'

describe('taxonomies', () => {
  it('lists only categories that hold something', async () => {
    const payload = await body(await listCategories(get('/api/v1/categories')))
    expect(payload.data.length).toBeGreaterThan(0)
    for (const category of payload.data) {
      expect(category.articleCount).toBeGreaterThan(0)
      expect(category.url).toContain('/topics/')
    }
  })

  it('counts tags, most-used first', async () => {
    const payload = await body(await listTags(get('/api/v1/tags')))
    expect(payload.data.length).toBeGreaterThan(0)
    const counts = payload.data.map((tag: any) => tag.articleCount)
    expect([...counts].sort((a: number, b: number) => b - a)).toEqual(counts)
    for (const tag of payload.data) expect(tag.tag).toMatch(/^[a-z0-9-]+$/)
  })

  it('lists bylines that have published', async () => {
    const payload = await body(await listAuthors(get('/api/v1/authors')))
    expect(payload.data.length).toBeGreaterThan(0)
    for (const author of payload.data) {
      expect(author.name).toBeTruthy()
      expect(author.articleCount).toBeGreaterThan(0)
    }
  })
})

describe('prophecy records', () => {
  it('lists them with their primary source', async () => {
    const payload = await body(await listProphecies(get('/api/v1/prophecies')))
    expect(payload.pagination.total).toBe(prophecyRecords.length)
    for (const record of payload.data) {
      expect(record.type).toBe('prophecy-record')
      expect(record.primarySource).toContain('youtube.com')
    }
  })

  it('leaves an unconfirmed date null rather than guessing one', async () => {
    const payload = await body(await listProphecies(get('/api/v1/prophecies?limit=100')))
    const unconfirmed = payload.data.filter((record: any) => record.publishedAt === null)
    for (const record of unconfirmed) expect(record.dateNote).toBeTruthy()
  })

  it('reports fulfilment as the ministry designation it is', async () => {
    const payload = await body(await listProphecies(get('/api/v1/prophecies?limit=100')))
    for (const record of payload.data) {
      expect(record).toHaveProperty('fulfilledByMinistry')
      expect(record).not.toHaveProperty('fulfilled')
    }
  })

  it('returns the timeline only on the detail endpoint', async () => {
    const id = prophecyRecords[0].id
    const list = await body(await listProphecies(get('/api/v1/prophecies?limit=100')))
    expect(list.data[0]).not.toHaveProperty('timeline')
    const detail = await body(await getProphecyRoute(get(`/api/v1/prophecies/${id}`), { params: { id } }))
    expect(detail.data).toHaveProperty('timeline')
  })

  it('404s an unknown record', async () => {
    const response = await getProphecyRoute(get('/api/v1/prophecies/nope'), { params: { id: 'nope' } })
    expect(response.status).toBe(404)
    expect((await body(response)).error.code).toBe('RECORD_NOT_FOUND')
  })
})

describe('teaching recordings', () => {
  it('lists them', async () => {
    const payload = await body(await listTeachings(get('/api/v1/teachings')))
    expect(payload.pagination.total).toBe(teachingRecordings.length)
  })

  it('retrieves one', async () => {
    const id = teachingRecordings[0].id
    const payload = await body(await getTeachingRoute(get(`/api/v1/teachings/${id}`), { params: { id } }))
    expect(payload.data.id).toBe(id)
    expect(payload.data.canonicalUrl).toContain('/teachings/')
  })

  it('404s an unknown recording', async () => {
    const response = await getTeachingRoute(get('/api/v1/teachings/nope'), { params: { id: 'nope' } })
    expect(response.status).toBe(404)
    expect((await body(response)).error.code).toBe('TEACHING_NOT_FOUND')
  })
})
