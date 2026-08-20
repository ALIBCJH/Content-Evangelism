import { ok } from '@/lib/api/respond'
import { publishedArticles, tagsWithCounts } from '@/lib/api/service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/tags — what the writing is about, under the section.
 *
 * Counted from the articles themselves rather than from a list somebody
 * maintains, so a tag exists here exactly as long as something carries it.
 */
export async function GET() {
  const tags = tagsWithCounts(await publishedArticles())
  return ok({ data: tags, meta: { total: tags.length } })
}
