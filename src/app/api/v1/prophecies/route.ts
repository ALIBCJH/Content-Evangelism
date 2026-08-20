import { paginate, parseParams } from '@/lib/api/params'
import { prophecyResource } from '@/lib/api/resources'
import { fail, ok } from '@/lib/api/respond'
import { searchAll } from '@/lib/api/service'
import { prophecyRecords } from '@/lib/prophecies'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/prophecies — the prophetic record.
 *
 * These are records of what was said and when, held against their primary
 * source. `q` searches them; `tag` narrows by the nation or the subject
 * they are filed under.
 */
export async function GET(request: Request) {
  const parsed = parseParams(new URL(request.url))
  if (!parsed.ok) return fail(parsed.error)
  const params = parsed.value

  let records = prophecyRecords
  if (params.tag) {
    const wanted = params.tag.replace(/-/g, ' ')
    records = records.filter((record) =>
      record.tags.some((tag) => tag.toLowerCase() === wanted)
    )
  }
  if (params.q) {
    const order = searchAll([], params.q, ['prophecy-record']).map((hit) => hit.record!.id)
    records = records
      .filter((record) => order.includes(record.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
  }

  const { window, pagination } = paginate(records, params.page, params.limit)
  return ok({
    data: window.map((record) => prophecyResource(record)),
    pagination,
    query: {
      ...(params.q ? { q: params.q } : {}),
      ...(params.tag ? { tag: params.tag } : {}),
      sort: params.q ? 'relevance' : 'newest',
    },
  })
}
