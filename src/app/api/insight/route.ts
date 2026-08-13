import { NextResponse } from 'next/server'
import { bearerToken } from '@/lib/posted'
import { cleanBatch, readInsight, record } from '@/lib/insight'

export const dynamic = 'force-dynamic'

/**
 * POST /api/insight — a reader's page reporting on itself.
 *
 * Open, because it is a browser posting it and there is no reader to
 * authenticate. What keeps that safe is that there is nothing here worth
 * forging and nothing to extract: the body may only name a path on this
 * site, a count of seconds, and clicks drawn from a fixed list, and the
 * response says nothing back. Anything else in the body is dropped.
 *
 * The request honours Do Not Track and Global Privacy Control. The
 * tracker does not send when either is set, and this refuses to count if
 * one arrives anyway — a preference should not depend on the client
 * respecting it.
 */
export async function POST(request: Request) {
  if (request.headers.get('dnt') === '1' || request.headers.get('sec-gpc') === '1') {
    return new NextResponse(null, { status: 204 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return new NextResponse(null, { status: 204 })
  }

  const raw = Array.isArray((payload as { batches?: unknown })?.batches)
    ? ((payload as { batches: unknown[] }).batches)
    : []
  const batches = raw.slice(0, 20).map(cleanBatch).filter(Boolean)

  if (batches.length > 0) {
    await record(batches as NonNullable<ReturnType<typeof cleanBatch>>[])
  }
  /* Nothing is returned. A page that reports on itself should not be able
     to read what every other reader has done. */
  return new NextResponse(null, { status: 204 })
}

/** GET /api/insight — the counters, for the desk. Requires the posting key. */
export async function GET(request: Request) {
  const expected = process.env.ADMIN_TOKEN ?? ''
  if (!expected || bearerToken(request) !== expected) {
    return NextResponse.json({ error: 'Invalid posting key.' }, { status: 401 })
  }
  return NextResponse.json({ pages: await readInsight() })
}
