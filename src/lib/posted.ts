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
 *
 * Underneath both sits a third thing, which is not a store: the pieces the
 * repository itself carries, in content/articles. A deployment with no
 * store attached used to serve an empty archive — the writing was in the
 * repo, and the site it was written for did not show it. So reads are the
 * union of the two: what is on the shelf, over what the repository ships.
 * Writes are untouched by this and go to the store alone, which keeps the
 * desk's copy authoritative for any slug it holds.
 */

const STORE = path.join(process.cwd(), 'data', 'articles.json')
const SEED_DIR = path.join(process.cwd(), 'content', 'articles')

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

/* ── The pieces the repository carries ────────────────────────────── */

/**
 * content/articles holds one JSON file per hand-written teaching, in
 * exactly the shape POST /api/articles accepts, and each carries the slug
 * that endpoint would have derived — so a file and a posted copy of the
 * same teaching are the same URL, and the merge below can tell them apart.
 *
 * Unlike a posted article these keep their own `publishedAt`, which is the
 * point: a piece written for the twelfth is dated the twelfth on the
 * archive, not the day the deployment happened to be built.
 *
 * Read once. The files are part of the build and cannot change under a
 * running instance, so re-reading them on every request would be a
 * directory listing per page view for a set that never moves.
 */
let seeded: Promise<PostedArticle[]> | null = null

async function readSeeded(): Promise<PostedArticle[]> {
  seeded ??= (async () => {
    try {
      const names = (await fs.readdir(SEED_DIR)).filter((name) => name.endsWith('.json'))
      const files = await Promise.all(
        names.map(async (name) => {
          try {
            const parsed = JSON.parse(await fs.readFile(path.join(SEED_DIR, name), 'utf8'))
            // A file missing either of these is not renderable, and one
            // broken file must not take the whole archive down with it.
            return parsed?.slug && parsed?.body ? (parsed as PostedArticle) : null
          } catch {
            return null
          }
        })
      )
      return files.filter((article): article is PostedArticle => article !== null)
    } catch {
      return []
    }
  })()
  return seeded
}

/**
 * Everything the site has to show. A slug held by the store wins: if a
 * teaching was edited at the desk, the edit is what a reader should get,
 * whatever the repository still says.
 *
 * Deleting a seeded piece is therefore not the desk's to do — it is a file
 * in the repository, removed by removing the file.
 */
async function readAll(): Promise<PostedArticle[]> {
  const [stored, fromRepo] = await Promise.all([readStore(), readSeeded()])
  const posted = new Set(stored.map((article) => article.slug))
  return [...stored, ...fromRepo.filter((article) => !posted.has(article.slug))]
}

/* ── Reads ────────────────────────────────────────────────────────── */

export async function listPostedArticles(): Promise<PostedArticle[]> {
  return (await readAll()).sort(byNewest)
}

export async function getPostedArticle(slug: string): Promise<PostedArticle | null> {
  const articles = await readAll()
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
    /* Against every slug the site serves, not merely the stored ones: a
       new piece must not silently take the URL of one the repository
       carries and shadow it. */
    slug: uniqueSlug(input.title, new Set((await readAll()).map((a) => a.slug))),
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
