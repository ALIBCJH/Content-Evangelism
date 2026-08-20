import { apiError } from '@/lib/api/errors'
import { prophecyResource } from '@/lib/api/resources'
import { fail, ok } from '@/lib/api/respond'
import { getProphecy } from '@/lib/api/service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/prophecies/{id} — one record, with its timeline and any
 * independent documentation the desk has gathered beside it.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const record = getProphecy(params.id)
  if (!record) {
    return fail(
      apiError('RECORD_NOT_FOUND', `No prophecy record with the id "${params.id}".`, {
        parameter: 'id',
      })
    )
  }
  return ok({ data: prophecyResource(record, true) })
}
