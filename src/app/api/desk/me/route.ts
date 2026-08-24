import { NextResponse } from 'next/server'
import { deskSession } from '@/lib/posted'
import { BIO_MAX, ROLE_MAX, listWriters, proposeProfile, withoutSecrets } from '@/lib/writers'

/**
 * Who is at the desk.
 *
 * The desk needs this for two things it could not do before: stamp a
 * writer's byline rather than asking them to type it, and show them their
 * own work rather than everybody's.
 *
 * A session bought with one of the ministry's own env keys is not a
 * person — it belongs to the ministry — and says so with `writer: null`
 * rather than inventing somebody. The desk falls back to the editorial
 * byline for that case, which is what it has always done.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await deskSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Not signed in at this desk.' }, { status: 401 })
  }

  const writer = session.writer
    ? (await listWriters()).find((held) => held.id === session.writer && held.active)
    : undefined

  return NextResponse.json({
    role: session.role,
    writer: writer ? withoutSecrets(writer) : null,
  })
}

/**
 * PATCH — a writer proposing new words about themselves.
 *
 * It does not go on the site. It waits for the review desk, exactly as a
 * teaching does: a writer may write what the site says about them, and
 * somebody else decides whether it is published under the ministry's
 * name. Their name is not among the fields — that is who they are, not
 * what they say about themselves, and changing it would move their author
 * page out from under any link to it.
 */
export async function PATCH(request: Request) {
  const session = await deskSession(request)
  if (!session?.writer) {
    return NextResponse.json(
      { error: 'Only a writer with a desk of their own has a profile.' },
      { status: 401 }
    )
  }

  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const role = String(payload.role ?? '').trim()
  const bio = String(payload.bio ?? '').trim()
  if (role.length < 2) return NextResponse.json({ error: 'Say what you do here.' }, { status: 400 })
  if (role.length > ROLE_MAX) {
    return NextResponse.json({ error: `A role may not exceed ${ROLE_MAX} characters.` }, { status: 400 })
  }
  if (bio.length < 20) {
    return NextResponse.json({ error: 'Write at least a sentence about yourself.' }, { status: 400 })
  }
  if (bio.length > BIO_MAX) {
    return NextResponse.json({ error: `A biography may not exceed ${BIO_MAX} characters.` }, { status: 400 })
  }

  const writer = await proposeProfile(session.writer, { role, bio })
  if (!writer) return NextResponse.json({ error: 'That writer is not on the register.' }, { status: 404 })
  return NextResponse.json({ ok: true, writer })
}
