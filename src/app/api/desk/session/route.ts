import { NextResponse } from 'next/server'
import { roleForKey } from '@/lib/posted'
import { writerForKey } from '@/lib/writers'
import { DESK_COOKIE, SESSION_HOURS, mintSession, type DeskSession } from '@/lib/desk-session'

/**
 * Signing in and out of the desk.
 *
 * The only place a desk key is ever sent from a browser. It is checked
 * here, against the environment, using the same constant-time comparison
 * the store uses — and then it is gone: what goes back is a cookie the
 * browser holds and no script on the page can read.
 *
 * There is no rate limit on the way in, and that is a decision rather
 * than an omission. The keys are 32 random bytes; guessing one is not a
 * thing that happens, and a counter held in one serverless instance's
 * memory would not see the attempt that landed on another. What it would
 * reliably do is lock out the ministry on a bad evening.
 *
 * A writer's key is checked with scrypt, which is deliberately slow — a
 * tenth of a second here, and a wall to anybody working through a stolen
 * registry. That it is slow is also, on its own, more of a brake on
 * guessing than a counter would have been.
 */
export const dynamic = 'force-dynamic'

/** POST — present a key, receive a session. */
export async function POST(request: Request) {
  let payload: { key?: unknown }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const given = String(payload.key ?? '')

  /* A writer's own key first, because it has a shape the ministry's two
     do not — `id.secret` — and asking the registry about something with
     no dot in it would be asking about a name nobody has. */
  const writer = await writerForKey(given)
  const ministryRole = writer ? null : roleForKey(given)
  const desk: DeskSession | null = writer
    ? { role: writer.canReview ? 'reviewer' : 'writer', writer: writer.id }
    : ministryRole
      ? { role: ministryRole }
      : null

  if (!desk) {
    /* One message for every way of being wrong. Telling somebody they
       have the posting key when they typed a guess at the review key is
       telling them a guess was half right — and telling them an id exists
       but its secret does not is worse. */
    return NextResponse.json({ error: 'That key was not recognised.' }, { status: 401 })
  }

  const session = await mintSession(desk, Date.now())
  if (!session) {
    return NextResponse.json({ error: 'The desk has no key configured.' }, { status: 500 })
  }

  const response = NextResponse.json({
    ok: true,
    role: desk.role,
    ...(writer ? { writer: { id: writer.id, name: writer.name } } : {}),
  })
  response.cookies.set(DESK_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    /* Lax, not Strict. Every write at this desk is a POST, PATCH or
       DELETE, and Lax withholds the cookie from all of them across sites
       — so the CSRF surface Strict would close is already closed, and
       `fromThisSite` closes it again in the request itself. What Strict
       would add is being signed out by following a link in from
       somewhere else, which is a cost with nothing bought. */
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_HOURS * 3600,
  })
  return response
}

/** DELETE — hand the session back. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(DESK_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}
