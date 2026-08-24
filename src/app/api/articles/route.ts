import { NextResponse } from 'next/server'
import {
  authorizedForDesk,
  deskSession,
  deskToken,
  createPostedArticle,
  listPostedArticles,
  validateInput,
} from '@/lib/posted'
import { revalidatePublished } from '@/lib/revalidate'
import { listWriters } from '@/lib/writers'

/**
 * The byline a request may use.
 *
 * A signed-in writer gets their own name, whatever the form sent — the
 * byline is who wrote it, and a field somebody types is a field somebody
 * can type anybody's name into. It also ends the older problem, which was
 * quieter: "Simon Juma", "simon juma" and "SIMON JUMA" were three authors
 * to the archive, and none of them had a page.
 *
 * A Bearer token is the ministry rather than a person, and keeps the
 * byline it sent — the public API is a contract, and a script posting on
 * behalf of a named contributor must still be able to say so.
 */
async function bylineFor(request: Request, asked: string): Promise<string> {
  const session = await deskSession(request)
  if (!session?.writer) return asked
  const writer = (await listWriters()).find((held) => held.id === session.writer && held.active)
  return writer?.name ?? asked
}

export const dynamic = 'force-dynamic'

/**
 * GET /api/articles — the archive.
 *
 * Published only, unless the caller holds a key: the review board and the
 * writer's own desk both read this, and both need to see what is waiting.
 * A caller with no key, or a wrong one, gets the site.
 *
 * `?mine=1` narrows it to the signed-in writer's own work. Narrowed here
 * rather than in the browser, because a filter applied after the fact is
 * a page that was still sent everybody's unpublished drafts — including
 * the ones a reviewer has sent back with a reason, which is a private
 * thing between a reviewer and the person who wrote it.
 */
export async function GET(request: Request) {
  const key = await deskToken(request)
  const includePending = key.length > 0 && authorizedForDesk(key)
  const articles = await listPostedArticles({ includePending })

  if (new URL(request.url).searchParams.get('mine') === '1') {
    const session = await deskSession(request)
    const writer = session?.writer
      ? (await listWriters()).find((held) => held.id === session.writer)
      : undefined
    /* A session that is not a person has no "own work", and is given the
       site rather than everybody's drafts. */
    const mine = writer ? articles.filter((a) => a.authorName === writer.name) : []
    return NextResponse.json({ articles: mine, writer: writer?.name ?? null })
  }

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

  const authorName = await bylineFor(request, input.authorName)
  const result = await createPostedArticle({ ...input, authorName }, await deskToken(request))
  if (!result.article) {
    const message = result.status === 401 ? 'Invalid posting key.' : result.error
    return NextResponse.json({ error: message }, { status: result.status })
  }
  const { slug } = result.article
  revalidatePublished(slug)
  return NextResponse.json({ ok: true, slug, url: `/articles/${slug}` }, { status: 201 })
}
