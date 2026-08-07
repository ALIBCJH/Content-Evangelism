import { promises as fs } from 'node:fs'
import path from 'node:path'
import { CATEGORIES, type Category } from '@/lib/content'

export { CATEGORIES }

/**
 * The article store — a local JSON file (data/articles.json) read straight
 * off disk. This module is the only place the frontend talks to the store;
 * everything else imports from here.
 *
 * PROTOTYPING MODE. The FastAPI backend in backend/ is unplugged for now so
 * the UI can be built and run with nothing but `npm run dev` — no Postgres,
 * no API process, no ADMIN_TOKEN. The exported surface below is byte-for-byte
 * the same as the HTTP version it replaced, so re-attaching the server later
 * means restoring the fetch calls in this file and touching nothing else.
 */

const STORE = path.join(process.cwd(), 'data', 'articles.json')

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
  /** Set on every edit; absent from articles written before the field shipped. */
  updatedAt?: string
  readMinutes: number
}

export interface ArticleInput {
  title: string
  dek: string
  category: Category
  authorName: string
  body: string
  imageUrl?: string
}

export interface WriteResult {
  status: number
  article?: PostedArticle
  error?: string
}

/* ── Disk access ──────────────────────────────────────────────────── */

async function readStore(): Promise<PostedArticle[]> {
  try {
    const raw = await fs.readFile(STORE, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as PostedArticle[]) : []
  } catch {
    // No store yet, or malformed — the site still renders its built-in pieces.
    return []
  }
}

async function writeStore(articles: PostedArticle[]): Promise<boolean> {
  try {
    await fs.mkdir(path.dirname(STORE), { recursive: true })
    await fs.writeFile(STORE, `${JSON.stringify(articles, null, 2)}\n`, 'utf8')
    return true
  } catch {
    // Read-only filesystem (most production hosts). Reads keep working.
    return false
  }
}

/** Newest first, matching the ordering the API used to guarantee. */
function byNewest(a: PostedArticle, b: PostedArticle): number {
  return b.publishedAt.localeCompare(a.publishedAt)
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** Collision-safe slug: "the-cross", then "the-cross-2", "the-cross-3"… */
function uniqueSlug(title: string, taken: Set<string>): string {
  const base = slugify(title) || 'article'
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

/** ~200 wpm, floored at one minute — the same figure the backend computed. */
function readMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

/* ── Reads ────────────────────────────────────────────────────────── */

export async function listPostedArticles(): Promise<PostedArticle[]> {
  return (await readStore()).sort(byNewest)
}

export async function getPostedArticle(slug: string): Promise<PostedArticle | null> {
  const articles = await readStore()
  return articles.find((a) => a.slug === slug) ?? null
}

/* ── Writes ───────────────────────────────────────────────────────── */

/**
 * With the API down there is no server holding ADMIN_TOKEN, so the posting
 * key is checked here against ADMIN_TOKEN in the environment. Unset means
 * writes are closed — a missing secret must never mean "allow everyone".
 */
function authorized(token: string): boolean {
  const expected = process.env.ADMIN_TOKEN ?? ''
  return expected.length > 0 && token === expected
}

export async function createPostedArticle(
  input: ArticleInput,
  token: string
): Promise<WriteResult> {
  if (!authorized(token)) return { status: 401, error: 'Invalid posting key.' }

  const articles = await readStore()
  const now = new Date().toISOString()
  const article: PostedArticle = {
    slug: uniqueSlug(input.title, new Set(articles.map((a) => a.slug))),
    title: input.title,
    dek: input.dek,
    category: input.category,
    authorName: input.authorName,
    body: input.body,
    imageUrl: input.imageUrl,
    publishedAt: now,
    updatedAt: now,
    readMinutes: readMinutes(input.body),
  }

  if (!(await writeStore([article, ...articles]))) {
    return { status: 500, error: 'The article store is not writable.' }
  }
  return { status: 201, article }
}

export async function updatePostedArticle(
  slug: string,
  input: Partial<ArticleInput>,
  token: string
): Promise<WriteResult> {
  if (!authorized(token)) return { status: 401, error: 'Invalid posting key.' }

  const articles = await readStore()
  const index = articles.findIndex((a) => a.slug === slug)
  if (index === -1) return { status: 404, error: 'No article with that slug.' }

  const article: PostedArticle = {
    ...articles[index],
    ...input,
    updatedAt: new Date().toISOString(),
  }
  // The body drives the reading time, so recompute it whenever it changes.
  if (input.body !== undefined) article.readMinutes = readMinutes(input.body)

  articles[index] = article
  if (!(await writeStore(articles))) {
    return { status: 500, error: 'The article store is not writable.' }
  }
  return { status: 200, article }
}

/** Returns the status code: 204 deleted, 404 unknown, 401 bad key. */
export async function deletePostedArticle(slug: string, token: string): Promise<number> {
  if (!authorized(token)) return 401

  const articles = await readStore()
  const remaining = articles.filter((a) => a.slug !== slug)
  if (remaining.length === articles.length) return 404
  return (await writeStore(remaining)) ? 204 : 500
}

/* ── Request helpers ──────────────────────────────────────────────── */

/** Bearer token from an incoming request. */
export function bearerToken(request: Request): string {
  const header = request.headers.get('authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice(7) : ''
}

/** Field checks so the posting desk gets clear messages. */
export function validateInput(
  payload: Record<string, unknown>
): { error?: string; input?: ArticleInput } {
  const title = String(payload.title ?? '').trim()
  const dek = String(payload.dek ?? '').trim()
  const body = String(payload.body ?? '').trim()
  const authorName = String(payload.authorName ?? '').trim() || 'The Editorial Desk'
  const category = String(payload.category ?? '') as Category
  const imageUrl = String(payload.imageUrl ?? '').trim()

  if (title.length < 3) return { error: 'A title is required.' }
  if (dek.length < 10) return { error: 'A summary (dek) of at least 10 characters is required.' }
  if (body.length < 50) return { error: 'The article body is too short.' }
  if (!CATEGORIES.includes(category)) {
    return { error: `Category must be one of: ${CATEGORIES.join(', ')}.` }
  }
  if (imageUrl && !/^(https:\/\/|\/)/.test(imageUrl)) {
    return { error: 'Image URL must start with https:// (or / for a local image).' }
  }
  return { input: { title, dek, category, authorName, body, imageUrl: imageUrl || undefined } }
}
