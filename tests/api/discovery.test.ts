import { describe, expect, it } from 'vitest'
import { GET as serviceDescription } from '@/app/api/v1/route'
import { GET as openapi } from '@/app/api/openapi.json/route'
import robots from '@/app/robots'
import sitemap from '@/app/sitemap'
import { ERROR_CODES } from '@/lib/api/errors'
import { LIMIT_MAX } from '@/lib/api/params'
import { body, get } from './helpers'

describe('GET /api/v1 — the front door', () => {
  it('answers the questions an agent has to ask first', async () => {
    const payload = await body(await serviceDescription())
    expect(payload.version).toBe('v1')
    expect(payload.language).toBe('en')
    expect(payload.usage.access).toBe('public, read-only')
    expect(payload.usage.methods).toEqual(['GET'])
    expect(payload.documentation.openapi).toContain('/api/openapi.json')
    expect(Object.keys(payload.collections)).toEqual(['articles', 'prophecies', 'teachings'])
    expect(payload.pagination.maxLimit).toBe(LIMIT_MAX)
    expect(payload.errors.codes).toEqual([...ERROR_CODES])
  })
})

describe('GET /api/openapi.json', () => {
  it('is a 3.1 document describing every published endpoint', async () => {
    const spec = await body(await openapi())
    expect(spec.openapi).toBe('3.1.0')
    expect(spec.info.title).toBeTruthy()
    expect(spec.servers[0].url).toMatch(/^https:\/\//)
    for (const path of [
      '/api/v1',
      '/api/openapi.json',
      '/api/v1/articles',
      '/api/v1/articles/{slug}',
      '/api/v1/prophecies',
      '/api/v1/prophecies/{id}',
      '/api/v1/teachings',
      '/api/v1/teachings/{id}',
      '/api/v1/categories',
      '/api/v1/tags',
      '/api/v1/authors',
      '/api/v1/search',
    ]) {
      expect(spec.paths[path]).toBeTruthy()
      expect(spec.paths[path].get.operationId).toBeTruthy()
      expect(spec.paths[path].get.responses['200']).toBeTruthy()
    }
  })

  it('describes only GET — the spec offers no way to write', async () => {
    const spec = await body(await openapi())
    for (const [path, item] of Object.entries<any>(spec.paths)) {
      expect(Object.keys(item), path).toEqual(['get'])
    }
  })

  it('resolves every $ref it uses', async () => {
    const spec = await body(await openapi())
    const refs: string[] = []
    const walk = (node: any) => {
      if (!node || typeof node !== 'object') return
      if (typeof node.$ref === 'string') refs.push(node.$ref)
      for (const value of Object.values(node)) walk(value)
    }
    walk(spec)
    expect(refs.length).toBeGreaterThan(10)
    for (const ref of Array.from(new Set(refs))) {
      const name = ref.replace('#/components/schemas/', '')
      expect(spec.components.schemas[name], ref).toBeTruthy()
    }
  })

  it('advertises the same bounds the routes enforce', async () => {
    const spec = await body(await openapi())
    const limit = spec.paths['/api/v1/articles'].get.parameters.find((p: any) => p.name === 'limit')
    expect(limit.schema.maximum).toBe(LIMIT_MAX)
    expect(spec.components.schemas.Error.properties.error.properties.code.enum).toEqual([...ERROR_CODES])
  })

  it('mentions no key, header or scheme for authentication', async () => {
    const spec = await body(await openapi())
    expect(spec.components.securitySchemes).toBeUndefined()
    expect(spec.security).toBeUndefined()
  })
})

describe('robots.txt', () => {
  it('opens the public API and keeps the desk shut', () => {
    const rules = robots().rules as any[]
    expect(rules.length).toBeGreaterThan(1)
    for (const rule of rules) {
      expect(rule.allow).toContain('/api/v1/')
      expect(rule.allow).toContain('/api/openapi.json')
      expect(rule.disallow).toContain('/admin')
      expect(rule.disallow).toContain('/api/')
    }
  })

  it('names the AI crawlers explicitly', () => {
    const agents = (robots().rules as any[]).map((rule) => rule.userAgent)
    expect(agents).toContain('GPTBot')
    expect(agents).toContain('ClaudeBot')
    expect(agents).toContain('PerplexityBot')
  })

  it('points at the sitemap', () => {
    expect(robots().sitemap).toContain('/sitemap.xml')
  })
})

describe('sitemap.xml', () => {
  it('carries the published pages and none of the private ones', async () => {
    const entries = await sitemap()
    const urls = entries.map((entry) => entry.url)
    expect(urls.some((url) => url.includes('/articles/'))).toBe(true)
    expect(urls.some((url) => url.includes('/prophecies/'))).toBe(true)
    expect(urls.some((url) => url.includes('/admin'))).toBe(false)
    expect(urls.some((url) => url.includes('/api/'))).toBe(false)
    expect(urls.some((url) => url.includes('/search'))).toBe(false)
  })

  it('stamps every entry with a date', async () => {
    for (const entry of await sitemap()) {
      if (entry.lastModified) expect(String(entry.lastModified)).not.toBe('Invalid Date')
    }
  })
})
