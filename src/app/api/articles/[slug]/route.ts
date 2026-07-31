import { NextResponse } from 'next/server'
import {
  CATEGORIES,
  deletePostedArticle,
  estimateReadMinutes,
  getPostedArticle,
  isAuthorized,
  savePostedArticle,
} from '@/lib/posted'
import type { Category } from '@/lib/content'

export const dynamic = 'force-dynamic'

interface Params {
  params: { slug: string }
}

/** GET /api/articles/[slug] — public single article. */
export async function GET(_request: Request, { params }: Params) {
  const article = await getPostedArticle(params.slug)
  if (!article) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  return NextResponse.json({ article })
}

/** PUT /api/articles/[slug] — update an article in place (requires posting key). */
export async function PUT(request: Request, { params }: Params) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Invalid posting key.' }, { status: 401 })
  }
  const existing = await getPostedArticle(params.slug)
  if (!existing) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const title = String(payload.title ?? '').trim()
  const dek = String(payload.dek ?? '').trim()
  const body = String(payload.body ?? '').trim()
  const authorName = String(payload.authorName ?? '').trim() || existing.authorName
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

  await savePostedArticle({
    ...existing,
    title,
    dek,
    body,
    category,
    authorName,
    imageUrl: imageUrl || undefined,
    readMinutes: estimateReadMinutes(body),
  })
  return NextResponse.json({ ok: true, slug: existing.slug, url: `/articles/${existing.slug}` })
}

/** DELETE /api/articles/[slug] — remove an article (requires posting key). */
export async function DELETE(request: Request, { params }: Params) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Invalid posting key.' }, { status: 401 })
  }
  const removed = await deletePostedArticle(params.slug)
  if (!removed) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
