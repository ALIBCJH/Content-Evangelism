import { promises as fs } from 'fs'
import path from 'path'
import { CATEGORIES, type Category } from '@/lib/content'

export { CATEGORIES }

/**
 * The light CMS store.
 *
 * Two backends, auto-detected:
 *  - Vercel KV / Upstash Redis (production): set KV_REST_API_URL and
 *    KV_REST_API_TOKEN — exactly the env vars Vercel injects when you
 *    attach a KV store to the project. Talked to over plain REST, so no
 *    extra npm dependency is needed.
 *  - Local JSON file (development): data/articles.json in the project
 *    root. Created on first write.
 */

export interface PostedArticle {
  slug: string
  title: string
  dek: string
  category: Category
  authorName: string
  /** Plain text. Blank line = new paragraph; a line starting with "## " = subheading. */
  body: string
  imageUrl?: string
  publishedAt: string
  readMinutes: number
}

const KV_KEY = 'rptw:articles'
const FILE_PATH = path.join(process.cwd(), 'data', 'articles.json')

const kvUrl = process.env.KV_REST_API_URL
const kvToken = process.env.KV_REST_API_TOKEN
const useKv = Boolean(kvUrl && kvToken)

async function kvGetAll(): Promise<PostedArticle[]> {
  const res = await fetch(`${kvUrl}/get/${KV_KEY}`, {
    headers: { Authorization: `Bearer ${kvToken}` },
    cache: 'no-store',
  })
  if (!res.ok) return []
  const json = (await res.json()) as { result: string | null }
  if (!json.result) return []
  try {
    return JSON.parse(json.result) as PostedArticle[]
  } catch {
    return []
  }
}

async function kvSetAll(articles: PostedArticle[]): Promise<void> {
  const res = await fetch(`${kvUrl}/set/${KV_KEY}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${kvToken}` },
    body: JSON.stringify(articles),
  })
  if (!res.ok) throw new Error(`KV write failed: ${res.status}`)
}

async function fileGetAll(): Promise<PostedArticle[]> {
  try {
    const raw = await fs.readFile(FILE_PATH, 'utf8')
    return JSON.parse(raw) as PostedArticle[]
  } catch {
    return []
  }
}

async function fileSetAll(articles: PostedArticle[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true })
  await fs.writeFile(FILE_PATH, JSON.stringify(articles, null, 2), 'utf8')
}

export async function listPostedArticles(): Promise<PostedArticle[]> {
  const articles = useKv ? await kvGetAll() : await fileGetAll()
  return articles.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export async function getPostedArticle(slug: string): Promise<PostedArticle | null> {
  const articles = await listPostedArticles()
  return articles.find((a) => a.slug === slug) ?? null
}

export async function savePostedArticle(article: PostedArticle): Promise<void> {
  const articles = useKv ? await kvGetAll() : await fileGetAll()
  const next = [...articles.filter((a) => a.slug !== article.slug), article]
  if (useKv) await kvSetAll(next)
  else await fileSetAll(next)
}

export async function deletePostedArticle(slug: string): Promise<boolean> {
  const articles = useKv ? await kvGetAll() : await fileGetAll()
  const next = articles.filter((a) => a.slug !== slug)
  if (next.length === articles.length) return false
  if (useKv) await kvSetAll(next)
  else await fileSetAll(next)
  return true
}

/* ── Helpers shared by the API layer ─────────────────────────────── */

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function estimateReadMinutes(body: string): number {
  const words = body.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

/** True when the request carries the admin posting key. */
export function isAuthorized(request: Request): boolean {
  const token = process.env.ADMIN_TOKEN || 'change-me'
  const header = request.headers.get('authorization') || ''
  return header === `Bearer ${token}`
}

