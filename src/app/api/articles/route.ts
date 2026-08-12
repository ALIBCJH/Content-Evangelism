import { NextResponse } from 'next/server'
import {
  bearerToken,
  createPostedArticle,
  listPostedArticles,
  validateInput,
} from '@/lib/posted'
import { revalidatePublished } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

/** GET /api/articles — public list of posted articles. */
export async function GET() {
  const articles = await listPostedArticles()
  return NextResponse.json({ articles })
}

/**
 * POST /api/articles — create an article.
 * The posting key is forwarded to the publication API, which is the one
 * authority on ADMIN_TOKEN.
 */
export async function POST(request: Request) {
  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { error, input } = validateInput(payload)
  if (error || !input) return NextResponse.json({ error }, { status: 400 })

  const result = await createPostedArticle(input, bearerToken(request))
  if (!result.article) {
    const message = result.status === 401 ? 'Invalid posting key.' : result.error
    return NextResponse.json({ error: message }, { status: result.status })
  }
  const { slug } = result.article
  revalidatePublished(slug)
  return NextResponse.json({ ok: true, slug, url: `/articles/${slug}` }, { status: 201 })
}
