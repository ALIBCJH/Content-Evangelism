import { apiError } from '@/lib/api/errors'
import { paginate, parseParams } from '@/lib/api/params'
import { articleSummary, prophecyResource, teachingResource } from '@/lib/api/resources'
import { authorDirectory } from '@/lib/authors'
import { fail, ok } from '@/lib/api/respond'
import { filterArticles, publishedArticles, searchAll, type SearchKind } from '@/lib/api/service'

export const dynamic = 'force-dynamic'

const KINDS: SearchKind[] = ['article', 'prophecy-record', 'teaching-recording']

/**
 * GET /api/v1/search — one question across the whole archive.
 *
 * Results are light: what it is, what it says in a sentence, where the
 * page is, and — because an agent cannot see the highlighted words a
 * reader would — which fields the query actually landed in, and what the
 * match was worth. The full teaching is one request further on, at the
 * `links.self` of any result.
 *
 * `type` narrows to one kind of thing. The article filters (category,
 * tag, author, date) apply to the article results and are ignored by the
 * other two, which have no author and no section.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = parseParams(url)
  if (!parsed.ok) return fail(parsed.error)
  const params = parsed.value

  if (!params.q) {
    return fail(
      apiError('INVALID_PARAMETER', 'q is required: give the search something to look for.', {
        parameter: 'q',
      })
    )
  }

  const typeRaw = (url.searchParams.get('type') ?? '').trim()
  let kinds = KINDS
  if (typeRaw) {
    const wanted = typeRaw.split(',').map((part) => part.trim()) as SearchKind[]
    const unknown = wanted.find((kind) => !KINDS.includes(kind))
    if (unknown) {
      return fail(
        apiError('INVALID_PARAMETER', `Unknown type: ${unknown}.`, {
          parameter: 'type',
          allowed: KINDS,
        })
      )
    }
    kinds = wanted
  }

  const rows = filterArticles(await publishedArticles(), params)
  const hits = searchAll(rows, params.q, kinds)
  const { window, pagination } = paginate(hits, params.page, params.limit)

  /* Read once for the whole page rather than per hit. */
  const directory = await authorDirectory()
  return ok({
    data: window.map((hit) => {
      const resource =
        hit.article
          ? articleSummary(hit.article, directory)
          : hit.record
            ? prophecyResource(hit.record)
            : teachingResource(hit.recording!)
      return {
        ...resource,
        /* Why this is here. `matchedFields` names where the words landed;
           `score` is this site's own weighting, comparable within one
           response and meaningless outside it. */
        match: { score: Number(hit.score.toFixed(2)), matchedFields: hit.matchedFields },
      }
    }),
    pagination,
    query: {
      q: params.q,
      types: kinds,
      ...(params.category ? { category: params.category } : {}),
      ...(params.tag ? { tag: params.tag } : {}),
      ...(params.author ? { author: params.author } : {}),
      ...(params.from ? { from: params.from } : {}),
      ...(params.to ? { to: params.to } : {}),
      sort: 'relevance',
    },
  })
}
