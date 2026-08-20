import { ok } from '@/lib/api/respond'
import { authorsWithCounts, publishedArticles } from '@/lib/api/service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/authors — the bylines that have published.
 *
 * A byline the site holds a profile for carries its id and page; one it
 * does not is still reported, by name, rather than dropped — the piece
 * exists and somebody wrote it.
 */
export async function GET() {
  const authors = authorsWithCounts(await publishedArticles())
  return ok({ data: authors, meta: { total: authors.length } })
}
