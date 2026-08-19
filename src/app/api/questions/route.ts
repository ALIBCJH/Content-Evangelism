import { NextResponse } from 'next/server'
import { bearerToken } from '@/lib/posted'
import { askQuestion, listQuestions, validateQuestion } from '@/lib/questions'

export const dynamic = 'force-dynamic'

/**
 * The question box.
 *
 * POST is open, because the person using it is a reader and there is
 * nobody to authenticate. Three things stand in for a login, none of
 * which asks anything of the reader:
 *
 *   - A honeypot field the form keeps off-screen. A person never fills
 *     it in; a bot filling every input does. A caught request is answered
 *     201 and thrown away, because telling a bot it was caught is how it
 *     learns to stop tripping the wire.
 *   - A rate limit, by address, held in memory for the window and never
 *     written down — the store itself keeps no address at all.
 *   - Bounds on every field, checked in the store module.
 *
 * There is deliberately no captcha. It would fall hardest on exactly the
 * readers this ministry serves, and a question is cheap to delete.
 */

const WINDOW_MS = 10 * 60 * 1000
const PER_WINDOW = 5

/**
 * In memory, so it resets when the instance does and does not survive to
 * become a record of anybody. On a serverless host each instance limits
 * only what it sees, which is a real weakness and an accepted one: this
 * is a speed bump, and the desk can delete what gets past it.
 */
const recent = new Map<string, number[]>()

function overLimit(address: string): boolean {
  const now = Date.now()
  const hits = (recent.get(address) ?? []).filter((at) => now - at < WINDOW_MS)
  hits.push(now)
  recent.set(address, hits)

  /* Keep the map from growing without bound on a long-lived instance. */
  if (recent.size > 5000) {
    Array.from(recent.entries()).forEach(([seenAddress, times]) => {
      if (times.every((seen: number) => now - seen >= WINDOW_MS)) recent.delete(seenAddress)
    })
  }
  return hits.length > PER_WINDOW
}

function addressOf(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for') ?? ''
  return forwarded.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

/** POST /api/questions — a reader asking something. */
export async function POST(request: Request) {
  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  /* The honeypot. Answered as though it worked. */
  if (String(payload.website ?? '').trim() !== '') {
    return NextResponse.json({ ok: true }, { status: 201 })
  }

  if (overLimit(addressOf(request))) {
    return NextResponse.json(
      { error: 'That is several questions in a short while. Please send the next one later.' },
      { status: 429 }
    )
  }

  const { error, input } = validateQuestion(payload)
  if (error || !input) return NextResponse.json({ error }, { status: 400 })

  const result = await askQuestion(input)
  if (!result.question) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  /* The id and nothing else: the reader has no use for the record, and a
     response that echoes the question back is a response worth forging. */
  return NextResponse.json({ ok: true }, { status: 201 })
}

/** GET /api/questions — the queue, for the desk. Requires the posting key. */
export async function GET(request: Request) {
  const { status, questions } = await listQuestions(bearerToken(request))
  if (!questions) return NextResponse.json({ error: 'Invalid posting key.' }, { status })
  return NextResponse.json({ questions })
}
