import { NextResponse } from 'next/server'
import {
  CATEGORIES,
  estimateReadMinutes,
  isAuthorized,
  listPostedArticles,
  savePostedArticle,
  slugify,
  type PostedArticle,
} from '@/lib/posted'
import type { Category } from '@/lib/content'

export const dynamic = 'force-dynamic'

/** GET /api/articles — public list of posted articles. */
export async function GET() {
  const articles = await listPostedArticles()
  return NextResponse.json({ articles })
}

/**
 * POST /api/articles — create an article.
 * Requires: Authorization: Bearer <ADMIN_TOKEN>
 * Body: { title, dek, category, authorName, body, imageUrl? }
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Invalid posting key.' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const title = String(payload.title ?? '').trim()
  const dek = String(payload.dek ?? '').trim()
  const body = String(payload.body ?? '').trim()
  const authorName = String(payload.authorName ?? '').trim() || 'The Editorial Desk'
  const category = String(payload.category ?? '') as Category
  const imageUrl = String(payload.imageUrl ?? '').trim()

  if (title.length < 3) return NextResponse.json({ error: 'A title is required.' }, { status: 400 })
  if (dek.length < 10) return NextResponse.json({ error: 'A summary (dek) of at least 10 characters is required.' }, { status: 400 })
  if (body.length < 50) return NextResponse.json({ error: 'The article body is too short.' }, { status: 400 })
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: `Category must be one of: ${CATEGORIES.join(', ')}.` }, { status: 400 })
  }
  if (imageUrl && !/^(https:\/\/|\/)/.test(imageUrl)) {
    return NextResponse.json({ error: 'Image URL must start with https:// (or / for a local image).' }, { status: 400 })
  }

  // Ensure a unique slug.
  const existing = await listPostedArticles()
  const base = slugify(title) || 'article'
  let slug = base
  let n = 2
  while (existing.some((a) => a.slug === slug) || slug === 'the-cross-of-jesus') {
    slug = `${base}-${n++}`
  }

  const article: PostedArticle = {
    slug,
    title,
    dek,
    category,
    authorName,
    body,
    imageUrl: imageUrl || undefined,
    publishedAt: new Date().toISOString(),
    readMinutes: estimateReadMinutes(body),
  }

  await savePostedArticle(article)
  return NextResponse.json({ ok: true, slug, url: `/articles/${slug}` }, { status: 201 })
}
