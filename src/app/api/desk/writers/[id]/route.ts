import { NextResponse } from 'next/server'
import { canReview, deskToken } from '@/lib/posted'
import { decideProfile, newKeyFor, setActive } from '@/lib/writers'
import { revalidateAuthors } from '@/lib/revalidate'

/**
 * One writer, as the review desk manages them.
 *
 * Three acts, and none of them is deletion. A writer's name is on
 * published teachings and their author page is an address somebody may
 * have shared; what ends when somebody leaves is their key, not the
 * record of what they wrote.
 */
export const dynamic = 'force-dynamic'

interface Params {
  params: { id: string }
}

export async function PATCH(request: Request, { params }: Params) {
  if (!canReview(await deskToken(request))) {
    return NextResponse.json({ error: 'Invalid review key.' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const action = String(payload.action ?? '')

  if (action === 'new-key') {
    const key = await newKeyFor(params.id)
    if (!key) return NextResponse.json({ error: 'No writer with that id.' }, { status: 404 })
    /* The old one stops working the moment this is answered. */
    return NextResponse.json({ ok: true, key })
  }

  if (action === 'activate' || action === 'deactivate') {
    const writer = await setActive(params.id, action === 'activate')
    if (!writer) return NextResponse.json({ error: 'No writer with that id.' }, { status: 404 })
    return NextResponse.json({ ok: true, writer })
  }

  if (action === 'approve-profile' || action === 'refuse-profile') {
    const writer = await decideProfile(params.id, action === 'approve-profile')
    if (!writer) return NextResponse.json({ error: 'No writer with that id.' }, { status: 404 })
    if (action === 'approve-profile') revalidateAuthors()
    return NextResponse.json({ ok: true, writer })
  }

  return NextResponse.json(
    { error: 'Action must be one of: new-key, activate, deactivate, approve-profile, refuse-profile.' },
    { status: 400 }
  )
}
