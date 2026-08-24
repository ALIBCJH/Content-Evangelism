import { NextResponse } from 'next/server'
import {
  deskToken,
  deletePostedArticle,
  getPostedArticle,
  updatePostedArticle,
  validateInput,
} from '@/lib/posted'
import { revalidatePublished } from '@/lib/revalidate'

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

/**
 * PUT /api/articles/[slug] — update an article in place.
 *
 * The byline is not touched. An edit is not a change of authorship: a
 * reviewer fixing a paragraph in somebody's teaching must not end up
 * signing it, and a writer reworking their own already carries their own
 * name. The one way a byline is set is at the moment a piece is created.
 */
export async function PUT(request: Request, { params }: Params) {
  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { error, input } = validateInput(payload)
  if (error || !input) return NextResponse.json({ error }, { status: 400 })

  const { authorName: _byline, ...withoutByline } = input
  const result = await updatePostedArticle(params.slug, withoutByline, await deskToken(request))
  if (!result.article) {
    const message =
      result.status === 401
        ? 'Invalid posting key.'
        : result.status === 404
          ? 'Not found.'
          : result.error
    return NextResponse.json({ error: message }, { status: result.status })
  }
  const { slug } = result.article
  revalidatePublished(slug)
  // An edit that changes the slug leaves the old URL cached behind it.
  if (slug !== params.slug) revalidatePublished(params.slug)
  return NextResponse.json({ ok: true, slug, url: `/articles/${slug}` })
}

/** DELETE /api/articles/[slug] — remove an article (requires posting key). */
export async function DELETE(request: Request, { params }: Params) {
  const status = await deletePostedArticle(params.slug, await deskToken(request))
  if (status === 204) {
    revalidatePublished(params.slug)
    return NextResponse.json({ ok: true })
  }
  const error =
    status === 401
      ? 'Invalid posting key.'
      : status === 403
        ? 'That teaching is on the site. Removing it needs the review key.'
        : status === 404
          ? 'Not found.'
          : 'Delete failed.'
  return NextResponse.json({ error }, { status })
}
