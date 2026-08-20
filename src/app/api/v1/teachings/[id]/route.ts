import { apiError } from '@/lib/api/errors'
import { teachingResource } from '@/lib/api/resources'
import { fail, ok } from '@/lib/api/respond'
import { getTeaching } from '@/lib/api/service'

export const dynamic = 'force-dynamic'

/** GET /api/v1/teachings/{id} — one recording. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const recording = getTeaching(params.id)
  if (!recording) {
    return fail(
      apiError('TEACHING_NOT_FOUND', `No teaching recording with the id "${params.id}".`, {
        parameter: 'id',
      })
    )
  }
  return ok({ data: teachingResource(recording) })
}
