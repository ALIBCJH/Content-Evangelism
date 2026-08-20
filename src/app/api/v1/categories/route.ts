import { ok } from '@/lib/api/respond'
import { categoriesWithCounts, publishedArticles } from '@/lib/api/service'

export const dynamic = 'force-dynamic'

/** GET /api/v1/categories — the sections that hold published writing. */
export async function GET() {
  const categories = categoriesWithCounts(await publishedArticles())
  return ok({ data: categories, meta: { total: categories.length } })
}
