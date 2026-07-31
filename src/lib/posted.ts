import { CATEGORIES, type Category } from '@/lib/content'

export { CATEGORIES }

/**
 * The article store — now the FastAPI backend (backend/), which owns the
 * Postgres database. This module is the only place the frontend talks to
 * it; everything else imports from here.
 *
 * API_URL points at the backend (default: local dev server). The write
 * calls forward the caller's posting key, so the backend remains the one
 * authority on ADMIN_TOKEN — the frontend never holds the secret.
 */

const API_URL = process.env.API_URL ?? 'http://localhost:8801'

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

/** FastAPI errors arrive as {detail: string | ValidationError[]}. */
function detailToMessage(detail: unknown): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const loc = Array.isArray(item?.loc) ? item.loc.slice(1).join('.') : ''
        return loc ? `${loc}: ${item?.msg ?? 'invalid'}` : String(item?.msg ?? 'invalid')
      })
      .join('; ')
  }
  return 'The publication API rejected the request.'
}

export async function listPostedArticles(): Promise<PostedArticle[]> {
  try {
    const res = await fetch(`${API_URL}/api/articles?limit=100`, { cache: 'no-store' })
    if (!res.ok) return []
    const json = (await res.json()) as { items?: PostedArticle[] }
    return json.items ?? []
  } catch {
    // API unreachable — the site still renders with its built-in pieces.
    return []
  }
}

export async function getPostedArticle(slug: string): Promise<PostedArticle | null> {
  try {
    const res = await fetch(`${API_URL}/api/articles/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as PostedArticle
  } catch {
    return null
  }
}

async function write(
  method: 'POST' | 'PATCH',
  path: string,
  input: Partial<ArticleInput>,
  token: string
): Promise<WriteResult> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
      cache: 'no-store',
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return { status: res.status, error: detailToMessage(json.detail) }
    return { status: res.status, article: json as PostedArticle }
  } catch {
    return { status: 502, error: 'Could not reach the publication API.' }
  }
}

export function createPostedArticle(input: ArticleInput, token: string): Promise<WriteResult> {
  return write('POST', '/api/articles', input, token)
}

export function updatePostedArticle(
  slug: string,
  input: Partial<ArticleInput>,
  token: string
): Promise<WriteResult> {
  return write('PATCH', `/api/articles/${encodeURIComponent(slug)}`, input, token)
}

/** Returns the API status code: 204 deleted, 404 unknown, 401 bad key. */
export async function deletePostedArticle(slug: string, token: string): Promise<number> {
  try {
    const res = await fetch(`${API_URL}/api/articles/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    return res.status
  } catch {
    return 502
  }
}

/** Bearer token from an incoming request, for forwarding to the API. */
export function bearerToken(request: Request): string {
  const header = request.headers.get('authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice(7) : ''
}

/** Friendly field checks so the posting desk gets clear messages; the
    publication API revalidates everything anyway. */
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
