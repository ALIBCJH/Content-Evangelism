import { apiError } from '@/lib/api/errors'
import { articleDetail } from '@/lib/api/resources'
import { authorDirectory } from '@/lib/authors'
import { fail, ok } from '@/lib/api/respond'
import { getArticle } from '@/lib/api/service'

export const dynamic = 'force-dynamic'

/** GET /api/v1/articles/{slug} — one teaching, in full. */
export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const found = await getArticle(params.slug)
  if (!found) {
    return fail(
      apiError('ARTICLE_NOT_FOUND', `No published article with the slug "${params.slug}".`, {
        parameter: 'slug',
      })
    )
  }
  return ok({ data: articleDetail(found.row, await authorDirectory(), found.related) })
}
