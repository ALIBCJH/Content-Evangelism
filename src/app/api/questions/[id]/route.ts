import { NextResponse } from 'next/server'
import { bearerToken } from '@/lib/posted'
import {
  QUESTION_STATUSES,
  deleteQuestion,
  updateQuestion,
  type QuestionStatus,
} from '@/lib/questions'

export const dynamic = 'force-dynamic'

interface Params {
  params: { id: string }
}

/**
 * One question, as the desk works it. There is no GET here: a question is
 * never public, and the queue is read whole through /api/questions with
 * the posting key.
 */

/** PATCH /api/questions/[id] — move it along the queue, or note it. */
export async function PATCH(request: Request, { params }: Params) {
  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const status = payload.status === undefined ? undefined : String(payload.status)
  if (status !== undefined && !QUESTION_STATUSES.includes(status as QuestionStatus)) {
    return NextResponse.json(
      { error: `Status must be one of: ${QUESTION_STATUSES.join(', ')}.` },
      { status: 400 }
    )
  }
  const note = payload.note === undefined ? undefined : String(payload.note).slice(0, 4000)

  const result = await updateQuestion(
    params.id,
    { status: status as QuestionStatus | undefined, note },
    bearerToken(request)
  )
  if (!result.question) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ ok: true, question: result.question })
}

/** DELETE /api/questions/[id] — remove it for good. */
export async function DELETE(request: Request, { params }: Params) {
  const status = await deleteQuestion(params.id, bearerToken(request))
  if (status === 204) return NextResponse.json({ ok: true })
  const error =
    status === 401 ? 'Invalid posting key.' : status === 404 ? 'Not found.' : 'Delete failed.'
  return NextResponse.json({ error }, { status })
}
