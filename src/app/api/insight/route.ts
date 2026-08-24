import { NextResponse } from 'next/server'
import { authorizedForDesk, deskToken } from '@/lib/posted'
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
/**
 * A ceiling on how often one address may report.
 *
 * The tracker sends on a thirty-second flush and when a page closes, so a
 * reader moving quickly through the archive might send a dozen times a
 * minute. Sixty in ten minutes is well clear of that and well under what
 * a script would want. Held in memory, like the question box's, and never
 * written down.
 */
const WINDOW_MS = 10 * 60 * 1000
const PER_WINDOW = 60
const recent = new Map<string, number[]>()

function overLimit(address: string): boolean {
  const now = Date.now()
  const hits = (recent.get(address) ?? []).filter((at) => now - at < WINDOW_MS)
  hits.push(now)
  recent.set(address, hits)
  if (recent.size > 5000) {
    Array.from(recent.entries()).forEach(([seen, times]) => {
      if (times.every((at: number) => now - at >= WINDOW_MS)) recent.delete(seen)
    })
  }
  return hits.length > PER_WINDOW
}

function addressOf(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for') ?? ''
  return forwarded.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

export async function POST(request: Request) {
  if (request.headers.get('dnt') === '1' || request.headers.get('sec-gpc') === '1') {
    return new NextResponse(null, { status: 204 })
  }

  /* Answered 204 rather than 429: a counter has nothing to tell a caller,
     and a page must never be slowed or broken by one. */
  if (overLimit(addressOf(request))) return new NextResponse(null, { status: 204 })

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
  /* Whichever desk key the caller holds. It compared against ADMIN_TOKEN
     alone and with ===, which meant a reviewer was refused their own
     counters and the comparison told a guesser how much of the key was
     right. `authorizedForDesk` answers both. */
  if (!authorizedForDesk(await deskToken(request))) {
    return NextResponse.json({ error: 'Invalid posting key.' }, { status: 401 })
  }
  return NextResponse.json({ pages: await readInsight() })
}
