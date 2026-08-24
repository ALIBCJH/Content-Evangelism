import { NextResponse } from 'next/server'
import { roleForKey } from '@/lib/posted'
import { DESK_COOKIE, SESSION_HOURS, mintSession } from '@/lib/desk-session'

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

  const role = roleForKey(String(payload.key ?? ''))
  if (!role) {
    /* One message for both keys. Telling somebody they have the posting
       key when they typed a guess at the review key is telling them a
       guess was half right. */
    return NextResponse.json({ error: 'That key was not recognised.' }, { status: 401 })
  }

  const session = await mintSession(role, Date.now())
  if (!session) {
    return NextResponse.json({ error: 'The desk has no key configured.' }, { status: 500 })
  }

  const response = NextResponse.json({ ok: true, role })
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
