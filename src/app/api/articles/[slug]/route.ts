import { NextResponse } from 'next/server'
import {
  canReview,
  deskSession,
  deskToken,
  deletePostedArticle,
  getPostedArticle,
  isLive,
  updatePostedArticle,
  validateInput,
  wroteIt,
} from '@/lib/posted'
import { revalidatePublished } from '@/lib/revalidate'
import { listWriters } from '@/lib/writers'

/**
 * Who is making this edit, when the answer is a person.
 *
 * Null for a Bearer token — that is the ministry's own key rather than
 * somebody at a desk, and the store gives it the blanket authority the
 * public API was built on. Null too for a session bought with one of the
 * ministry's env keys, which belongs to the ministry and not to anybody
 * whose work could be "theirs".
 */
async function editorOf(request: Request): Promise<{ id: string; name: string } | null> {
  const session = await deskSession(request)
  if (!session?.writer) return null
  const writer = (await listWriters()).find((held) => held.id === session.writer && held.active)
  return writer ? { id: writer.id, name: writer.name } : null
}

export const dynamic = 'force-dynamic'

interface Params {
  params: { slug: string }
}

/**
 * GET /api/articles/[slug] — one article.
 *
 * Published only, unless the caller is somebody the piece belongs to —
 * the same rule the archive listing keeps, for the same reason. A desk
 * that can take a teaching off the site and then cannot open it again has
 * a one-way door, and that is what this was: the review desk's "Edit at
 * the posting desk" link, and now "Give it a picture", both send somebody
 * to a form that has to be filled from the teaching they named.
 *
 * A reviewer may read anything. A writer may read their own, pending or
 * not, which is what the posting desk already shows them. Anybody else
 * gets the 404 a reader gets — including a writer asking after somebody
 * else's draft, because a reviewer's reason for sending a piece back is
 * between the reviewer and the person who wrote it.
 */
export async function GET(request: Request, { params }: Params) {
  const article = await getPostedArticle(params.slug, { includePending: true })
  if (!article) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  if (!isLive(article) && !canReview(await deskToken(request))) {
    const editor = await editorOf(request)
    if (!editor || !wroteIt(article, editor)) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }
  }
  return NextResponse.json({ article })
}

/**
 * PUT /api/articles/[slug] — update an article in place.
 *
 * The byline is not touched, and neither is the id behind it. An edit is
 * not a change of authorship: a reviewer fixing a paragraph in somebody's
 * teaching must not end up signing it, and a writer reworking their own
 * already carries their own name. The one way a piece is attributed is at
 * the moment it is created.
 *
 * Who may edit what is the store's rule rather than this route's — see
 * `updatePostedArticle`. In short: a writer edits their own, a reviewer
 * edits anybody's, and an edit to something already on the site by
 * somebody who cannot approve sends it back to the queue rather than
 * changing what readers are being shown.
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

  /* Dropped rather than trusted. `validateInput` reads neither from the
     body, so neither should be here at all — stripping them is the
     invariant written down where an edit happens, so that a later field
     added to the input cannot quietly become a way to reassign a piece. */
  const { authorName: _byline, authorId: _wrote, ...withoutByline } = input
  const result = await updatePostedArticle(
    params.slug,
    withoutByline,
    await deskToken(request),
    await editorOf(request)
  )
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
        : status === 409
          ? 'That teaching is a file in the repository, not a record at the desk. Unpublish it to take it off the site; removing it for good means removing the file.'
          : status === 404
            ? 'Not found.'
            : 'Delete failed.'
  return NextResponse.json({ error }, { status })
}
