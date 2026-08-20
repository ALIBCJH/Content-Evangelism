import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import * as articles from '@/app/api/v1/articles/route'
import * as article from '@/app/api/v1/articles/[slug]/route'
import * as search from '@/app/api/v1/search/route'
import * as prophecies from '@/app/api/v1/prophecies/route'
import * as teachings from '@/app/api/v1/teachings/route'
import * as categories from '@/app/api/v1/categories/route'
import * as tags from '@/app/api/v1/tags/route'
import * as authors from '@/app/api/v1/authors/route'
import * as index from '@/app/api/v1/route'
import { isPublished } from '@/lib/api/service'
import { body, get } from './helpers'

const V1_ROOT = path.join(process.cwd(), 'src', 'app', 'api', 'v1')

function everyRouteFile(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    return statSync(full).isDirectory() ? everyRouteFile(full) : full.endsWith('route.ts') ? [full] : []
  })
}

describe('v1 is read-only', () => {
  it('exports no write handler anywhere', () => {
    const modules = { articles, article, search, prophecies, teachings, categories, tags, authors, index }
    for (const [name, module] of Object.entries(modules)) {
      for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
        expect(module, `${name}.${method}`).not.toHaveProperty(method)
      }
      expect(module).toHaveProperty('GET')
    }
  })

  it('never reaches a write function in the store', () => {
    /* Read as text rather than called: the point is that the write path
       is not imported at all, so no amount of crafted input can reach it. */
    for (const file of everyRouteFile(V1_ROOT)) {
      const source = readFileSync(file, 'utf8')
      for (const forbidden of ['createPostedArticle', 'updatePostedArticle', 'deletePostedArticle', 'askQuestion']) {
        expect(source, `${file} imports ${forbidden}`).not.toContain(forbidden)
      }
    }
  })

  it('never reads a secret', () => {
    for (const file of everyRouteFile(V1_ROOT)) {
      const source = readFileSync(file, 'utf8')
      expect(source, file).not.toContain('process.env')
      expect(source, file).not.toContain('ADMIN_TOKEN')
      expect(source, file).not.toContain('bearerToken')
    }
  })
})

describe('what the API refuses to say', () => {
  it('keeps the publication boundary even though the desk has no drafts', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString()
    expect(isPublished({ publishedAt: future })).toBe(false)
    expect(isPublished({ publishedAt: '2026-01-01T00:00:00.000Z' })).toBe(true)
  })

  it('leaks no environment, credential or store internals in a response', async () => {
    const payloads = await Promise.all([
      articles.GET(get('/api/v1/articles?limit=100')).then((r) => r.text()),
      search.GET(get('/api/v1/search?q=holiness&limit=100')).then((r) => r.text()),
      index.GET().then((r) => r.text()),
      prophecies.GET(get('/api/v1/prophecies?limit=100')).then((r) => r.text()),
    ])
    for (const payload of payloads) {
      for (const secret of ['ADMIN_TOKEN', 'UPSTASH', 'REDIS', 'process.env', 'data/articles.json']) {
        expect(payload).not.toContain(secret)
      }
    }
  })

  it('says nothing about reader questions or the page counter', async () => {
    const payload = await index.GET().then((r) => r.text())
    expect(payload).not.toContain('/api/questions')
    expect(payload).not.toContain('/api/insight')
  })

  it('does not cache a refusal, so a new article is not hidden by a stale 404', async () => {
    const response = await article.GET(get('/api/v1/articles/nope'), { params: { slug: 'nope' } })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('caches a successful read and points at its own specification', async () => {
    const response = await articles.GET(get('/api/v1/articles'))
    expect(response.headers.get('Cache-Control')).toContain('s-maxage')
    expect(response.headers.get('Link')).toContain('rel="service-desc"')
  })
})

describe('versioning', () => {
  it('answers under /api/v1 and describes itself as v1', async () => {
    const payload = await body(await index.GET())
    expect(payload.version).toBe('v1')
    for (const collection of Object.values<any>(payload.collections)) {
      expect(collection.url).toContain('/api/v1/')
    }
  })

  it('keeps the unversioned desk routes out of the versioned tree', () => {
    const files = everyRouteFile(V1_ROOT).map((file) => file.replace(process.cwd(), ''))
    expect(files.some((file) => file.includes('questions'))).toBe(false)
    expect(files.some((file) => file.includes('insight'))).toBe(false)
  })
})
