import { NextResponse } from 'next/server'
import { deskToken } from '@/lib/posted'
import { revalidateAnswers } from '@/lib/revalidate'
import {
  QUESTION_STATUSES,
  deleteQuestion,
  listQuestions,
  updateQuestion,
  validateAnswer,
  type PublishInput,
  type QuestionStatus,
} from '@/lib/questions'

export const dynamic = 'force-dynamic'

/** The address a question's page is at now, before anything changes it. */
async function slugOf(id: string, token: string): Promise<string | undefined> {
  const listed = await listQuestions(token)
  return listed.questions?.find((question) => question.id === id)?.published?.slug
}

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

  /* `published` is three states, not two: absent leaves the page as it
     is, null takes it down, and an object publishes or rewrites it. */
  let published: PublishInput | null | undefined
  if (payload.published === null) {
    published = null
  } else if (payload.published !== undefined) {
    const checked = validateAnswer(payload.published as Record<string, unknown>)
    if (!checked.input) return NextResponse.json({ error: checked.error }, { status: 400 })
    published = checked.input
  }

  const standingSlug = published === null ? await slugOf(params.id, await deskToken(request)) : undefined

  const result = await updateQuestion(
    params.id,
    { status: status as QuestionStatus | undefined, note, published },
    await deskToken(request)
  )
  if (!result.question) return NextResponse.json({ error: result.error }, { status: result.status })

  /* A page went up, changed or came down: the desk should see it on the
     site rather than five minutes after the site agrees. The slug is the
     one it had, so taking a page down flushes the address it was at. */
  if (published !== undefined) {
    revalidateAnswers(result.question.published?.slug ?? standingSlug)
  }
  return NextResponse.json({ ok: true, question: result.question })
}

/** DELETE /api/questions/[id] — remove it for good. */
export async function DELETE(request: Request, { params }: Params) {
  const status = await deleteQuestion(params.id, await deskToken(request))
  if (status === 204) return NextResponse.json({ ok: true })
  const error =
    status === 401 ? 'Invalid posting key.' : status === 404 ? 'Not found.' : 'Delete failed.'
  return NextResponse.json({ error }, { status })
}
