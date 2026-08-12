import { promises as fs } from 'node:fs'
import path from 'node:path'
import { CATEGORIES, type Category } from '@/lib/content'
import { isAllowedImageHost } from '@/lib/seo'

export { CATEGORIES }

/**
 * The article store. This module is the only place the frontend talks to
 * the store; everything else imports from here.
 *
 * There is no separate API process. The FastAPI service in backend/ is
 * unplugged, so the site deploys as one Next.js app — route handlers call
 * straight into the functions below.
 *
 * Two drivers sit behind one shape, chosen by what is in the environment:
 *
 *   - Upstash Redis, when the deployment has KV credentials. Serverless
 *     hosts give you a read-only filesystem, so a published article has
 *     to live somewhere off the instance.
 *   - A JSON file at data/articles.json otherwise, so `npm run dev` needs
 *     nothing but the repo.
 *
 * Both hold the same thing — the whole article array, newest first — so
 * moving between them is a matter of copying one JSON document.
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
  /** What the image shows, for screen readers and image search. */
  imageAlt?: string
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
  imageAlt?: string
}

export interface WriteResult {
  status: number
  article?: PostedArticle
  error?: string
}

/* ── Upstash Redis ────────────────────────────────────────────────── */

/**
 * Vercel's own integration injects the `KV_REST_API_*` pair; attaching
 * Upstash directly gives you `UPSTASH_REDIS_REST_*`. They address the
 * same REST endpoint, so accept either rather than making the setup
 * depend on which tab the store was created from.
 */
const KV_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? ''
const KV_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
const KV_KEY = 'articles'

/** Both halves or neither — a URL with no token would fail on every call. */
const usingKv = Boolean(KV_URL && KV_TOKEN)

/**
 * Upstash speaks Redis over HTTPS, so the whole driver is one fetch and
 * no dependency. Commands go in the body as a JSON array rather than in
 * the path: an article body is far longer than a URL may safely be.
 */
async function kvCommand(command: (string | number)[]): Promise<unknown> {
  const response = await fetch(KV_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`Upstash ${command[0]} returned ${response.status}.`)
  }
  const payload = (await response.json()) as { result?: unknown; error?: string }
  if (payload.error) throw new Error(`Upstash ${command[0]}: ${payload.error}`)
  return payload.result
}

/* ── Store access ─────────────────────────────────────────────────── */

/** Anything that is not a well-formed array is treated as an empty store. */
function parseArticles(raw: unknown): PostedArticle[] {
  if (typeof raw === 'string') {
    try {
      return parseArticles(JSON.parse(raw))
    } catch {
      return []
    }
  }
  return Array.isArray(raw) ? (raw as PostedArticle[]) : []
}

async function readStore(): Promise<PostedArticle[]> {
  try {
    if (usingKv) return parseArticles(await kvCommand(['GET', KV_KEY]))
    return parseArticles(await fs.readFile(STORE, 'utf8'))
  } catch {
    // No store yet, malformed, or Upstash unreachable — the site still
    // renders its built-in pieces rather than failing to render at all.
    return []
  }
}

async function writeStore(articles: PostedArticle[]): Promise<boolean> {
  const serialized = `${JSON.stringify(articles, null, 2)}\n`
  try {
    if (usingKv) {
      await kvCommand(['SET', KV_KEY, serialized])
      return true
    }
    await fs.mkdir(path.dirname(STORE), { recursive: true })
    await fs.writeFile(STORE, serialized, 'utf8')
    return true
  } catch {
    // A read-only filesystem (any serverless host, with no store attached)
    // or an Upstash call that did not land. Reads keep working either way.
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
    imageAlt: input.imageAlt,
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
  const imageAlt = String(payload.imageAlt ?? '').trim()

  if (title.length < 3) return { error: 'A title is required.' }
  if (dek.length < 10) return { error: 'A summary (dek) of at least 10 characters is required.' }
  if (body.length < 50) return { error: 'The article body is too short.' }
  if (!CATEGORIES.includes(category)) {
    return { error: `Category must be one of: ${CATEGORIES.join(', ')}.` }
  }
  if (imageUrl && !/^(https:\/\/|\/)/.test(imageUrl)) {
    return { error: 'Image URL must start with https:// (or / for a local image).' }
  }
  // The optimizer only resizes allowlisted hosts, so an unlisted one would
  // publish an article that 500s on load. Catch it here instead.
  if (imageUrl.startsWith('https://') && !isAllowedImageHost(imageUrl)) {
    return {
      error:
        'That image host is not allowed. Upload the image to /public/images instead, or add the host to IMAGE_HOSTS.',
    }
  }
  if (imageUrl && !imageAlt) {
    return { error: 'Describe the image in a few words so readers using a screen reader know what it shows.' }
  }
  return {
    input: {
      title, dek, category, authorName, body,
      imageUrl: imageUrl || undefined,
      imageAlt: imageAlt || undefined,
    },
  }
}
