import { NextResponse } from 'next/server'
import { addressOf } from '@/lib/client-address'
import { addLike, isSlug } from '@/lib/likes'

/**
 * POST /api/likes — a reader saying a teaching helped them.
 *
 * Open, because it is a browser posting it and there is no reader to
 * authenticate. What keeps that safe is the same thing that keeps
 * `/api/insight` safe: the body may name a slug and nothing else,
 * anything else is dropped, and the response says nothing back.
 *
 * There is no GET. The counts are rendered on the server where they are
 * shown, so a page that adds to a number has no way to read every other
 * number — and a public endpoint returning the whole table is a scraper's
 * convenience with no reader's use.
 *
 * Not gated on Do Not Track, unlike the counters, and the distinction is
 * worth stating: DNT is a request not to be *tracked*, and this does not
 * track anybody. It records that a thing happened, once, with nothing
 * attached to say who did it. Refusing a reader's deliberate "yes"
 * because their browser asks not to be followed would be honouring the
 * letter of a preference against the reader's own instruction.
 */
export const dynamic = 'force-dynamic'

/**
 * A ceiling on how often one address may say yes.
 *
 * A reader finishes a teaching, is asked once, and answers once. Ten in
 * ten minutes is far more than any honest reader produces and far less
 * than a script would want. Held in memory, like the counters' and the
 * question box's, and never written down.
 */
const WINDOW_MS = 10 * 60 * 1000
const PER_WINDOW = 10
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

export async function POST(request: Request) {
  /* 204 rather than 429 throughout. A heart has nothing to tell a caller,
     and a reader who has just finished a teaching should never be shown
     an error because a counter was busy. */
  if (overLimit(addressOf(request))) return new NextResponse(null, { status: 204 })

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return new NextResponse(null, { status: 204 })
  }

  const slug = (payload as { slug?: unknown })?.slug
  if (!isSlug(slug)) return new NextResponse(null, { status: 204 })

  await addLike(slug)
  return new NextResponse(null, { status: 204 })
}
