import { paginate, parseParams } from '@/lib/api/params'
import { teachingResource } from '@/lib/api/resources'
import { fail, ok } from '@/lib/api/respond'
import { searchAll } from '@/lib/api/service'
import { teachingRecordings } from '@/lib/teachings'

export const dynamic = 'force-dynamic'

/** GET /api/v1/teachings — the recorded teachings the site holds. */
export async function GET(request: Request) {
  const parsed = parseParams(new URL(request.url))
  if (!parsed.ok) return fail(parsed.error)
  const params = parsed.value

  let recordings = teachingRecordings
  if (params.q) {
    const order = searchAll([], params.q, ['teaching-recording']).map((hit) => hit.recording!.id)
    recordings = recordings
      .filter((recording) => order.includes(recording.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
  }

  const { window, pagination } = paginate(recordings, params.page, params.limit)
  return ok({
    data: window.map(teachingResource),
    pagination,
    query: { ...(params.q ? { q: params.q } : {}), sort: params.q ? 'relevance' : 'newest' },
  })
}
