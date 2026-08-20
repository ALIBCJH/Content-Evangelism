import { NextResponse } from 'next/server'
import { bearerToken, reviewArticle } from '@/lib/posted'
import { revalidatePublished } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

/**
 * POST /api/review/{slug} — a senior reviewer's verdict.
 *
 * Kept apart from the posting routes because the authority is different:
 * the posting key writes teachings, this key decides which of them the
 * ministry is publishing. A posting key here is refused like any other
 * wrong key.
 */
export async function POST(request: Request, { params }: { params: { slug: string } }) {
  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const action = String(payload.action ?? '')
  if (action !== 'approve' && action !== 'send-back' && action !== 'unpublish') {
    return NextResponse.json(
      { error: 'Action must be approve, send-back or unpublish.' },
      { status: 400 }
    )
  }

  const result = await reviewArticle(
    params.slug,
    { action, note: typeof payload.note === 'string' ? payload.note : undefined },
    bearerToken(request)
  )
  if (!result.article) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  /* Approving puts a teaching on the site and unpublishing takes it off;
     either way the pages that list it are now wrong until they are told. */
  revalidatePublished(result.article.slug)
  return NextResponse.json({ ok: true, article: result.article })
}
