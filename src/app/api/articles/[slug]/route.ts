import { NextResponse } from 'next/server'
import { deletePostedArticle, getPostedArticle, isAuthorized } from '@/lib/posted'

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

/** DELETE /api/articles/[slug] — remove an article (requires posting key). */
export async function DELETE(request: Request, { params }: Params) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Invalid posting key.' }, { status: 401 })
  }
  const removed = await deletePostedArticle(params.slug)
  if (!removed) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
