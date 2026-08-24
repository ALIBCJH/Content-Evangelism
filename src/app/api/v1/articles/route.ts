import { apiError } from '@/lib/api/errors'
import { paginate, parseParams } from '@/lib/api/params'
import { articleSummary } from '@/lib/api/resources'
import { authorDirectory } from '@/lib/authors'
import { fail, ok } from '@/lib/api/respond'
import { filterArticles, publishedArticles, searchAll } from '@/lib/api/service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/articles — the writing, newest first.
 *
 * Filters compose: category, tag, author and a date window narrow the
 * collection, and `q` scores what is left. Summaries only — a listing
 * that shipped every body would be a megabyte an agent did not ask for,
 * and the body is one request away at the `links.self` of any row.
 */
export async function GET(request: Request) {
  const parsed = parseParams(new URL(request.url))
  if (!parsed.ok) return fail(parsed.error)
  const params = parsed.value

  const rows = filterArticles(await publishedArticles(), params)
  const matched = params.q
    ? searchAll(rows, params.q, ['article']).map((hit) => hit.article!)
    : rows

  const { window, pagination } = paginate(matched, params.page, params.limit)
  if (params.page > pagination.totalPages && matched.length > 0) {
    return fail(
      apiError('INVALID_PARAMETER', `page ${params.page} is past the last page (${pagination.totalPages}).`, {
        parameter: 'page',
      })
    )
  }

  /* Read once for the whole page rather than per article. */
  const directory = await authorDirectory()
  return ok({
    data: window.map((row) => articleSummary(row, directory)),
    pagination,
    /* What was actually applied, so a caller can see that its filter was
       understood rather than ignored. */
    query: {
      ...(params.q ? { q: params.q } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.tag ? { tag: params.tag } : {}),
      ...(params.author ? { author: params.author } : {}),
      ...(params.from ? { from: params.from } : {}),
      ...(params.to ? { to: params.to } : {}),
      sort: params.q ? 'relevance' : 'newest',
    },
  })
}
