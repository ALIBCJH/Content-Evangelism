import { NextResponse, type NextRequest } from 'next/server'
import { DESK_COOKIE, readSession } from '@/lib/desk-session'

/**
 * The door in front of the desk.
 *
 * Every page under /admin used to render to anybody who typed the
 * address — the heading, the queue, every teaching on the site — and then
 * asked for a key to unlock the buttons. That is a lock on the drawer of
 * an open room. This turns nobody-with-a-key away before the room is
 * rendered at all.
 *
 * It runs on the edge runtime, ahead of the page, which is why the
 * session module it leans on uses Web Crypto and imports nothing from
 * node. The check here is only ever "is this session real, and does it
 * reach this desk" — the keys themselves are never in scope.
 *
 * The API is deliberately not matched. A route handler checks the key it
 * is given on every call, for cookie and Bearer alike, and a gate in
 * front of it would be a second answer to a question already answered
 * correctly.
 */
export const config = {
  matcher: ['/admin/:path*'],
}

function toLogin(request: NextRequest, reason?: 'review'): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/admin/login'
  url.search = ''
  /* Where they were going, so the door opens onto it rather than onto
     the front of the desk. A path from this site only: `from` ends up in
     a redirect, and a redirect that will follow anything a query string
     says is an open redirect. */
  const from = `${request.nextUrl.pathname}${request.nextUrl.search}`
  if (from !== '/admin') url.searchParams.set('from', from)
  if (reason) url.searchParams.set('need', reason)
  return NextResponse.redirect(url)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/admin/login') return NextResponse.next()

  const role = await readSession(request.cookies.get(DESK_COOKIE)?.value, Date.now())
  if (!role) return toLogin(request)

  /* The posting key writes; it does not decide what goes on the site.
     Sent back to the door rather than shown an empty page, because the
     useful thing to say is "that key posts but does not approve". */
  if (pathname.startsWith('/admin/review') && role !== 'reviewer') {
    return toLogin(request, 'review')
  }

  return NextResponse.next()
}
