import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { publishedArticles } from '@/lib/api/service'
import { allPassages, retrieve } from '@/lib/ask/passages'
import { contextBlock, NOTHING_FOUND, SYSTEM } from '@/lib/ask/prompt'
import { addressOf } from '@/lib/client-address'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ask — a question, answered from the archive.
 *
 * The retrieval happens here rather than in the model: the site's own
 * scorer picks the chapters that bear on the question, and those are the
 * only thing the model is given. It cannot answer from anywhere else,
 * because it has not been given anywhere else.
 *
 * The answer streams, because a reader watching nothing happen for six
 * seconds assumes it is broken. The sources go first, as one JSON line,
 * so the panel can show where the answer is coming from while it arrives.
 *
 * What it costs is bounded on every axis that can run away: the question
 * is capped, the retrieved context is capped, the answer is capped, and
 * one address may ask a handful of questions in a window. Effort is low
 * because this is a short answer from passages already in front of it,
 * not a problem to be worked out.
 */

const QUESTION_MAX = 300
const WINDOW_MS = 10 * 60 * 1000
const PER_WINDOW = 8
const ANSWER_MAX_TOKENS = 700

/* In memory, so it resets when the instance does and never becomes a
   record of anybody — the same speed bump the question box uses. */
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
  /* No key, no answering — and the panel is told so plainly rather than
     being left to interpret a 500. */
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: { code: 'NOT_CONFIGURED', message: 'Answering is not switched on for this site.' } },
      { status: 503 }
    )
  }

  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Invalid JSON body.' } },
      { status: 400 }
    )
  }

  const question = String(payload.question ?? '').trim()
  if (question.length < 3) {
    return NextResponse.json(
      { error: { code: 'NO_QUESTION', message: 'Ask something.' } },
      { status: 400 }
    )
  }
  if (question.length > QUESTION_MAX) {
    return NextResponse.json(
      {
        error: {
          code: 'QUESTION_TOO_LONG',
          message: `Questions are limited to ${QUESTION_MAX} characters.`,
        },
      },
      { status: 400 }
    )
  }
  if (overLimit(addressOf(request))) {
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'That is several questions in a short while. Please ask the next one later.',
        },
      },
      { status: 429 }
    )
  }

  const passages = retrieve(allPassages(await publishedArticles()), question)

  /* Nothing in the archive touches the question. Said here, for nothing,
     rather than asked of a model that would have to be told to say it. */
  if (passages.length === 0) {
    return NextResponse.json({ answer: NOTHING_FOUND, sources: [] })
  }

  const sources = passages.map((passage) => ({
    title: passage.title,
    ...(passage.heading ? { heading: passage.heading } : {}),
    url: passage.url,
    kind: passage.kind,
  }))

  const client = new Anthropic()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      /* The sources first, as one line, so the panel can name them while
         the answer is still arriving. */
      controller.enqueue(encoder.encode(`${JSON.stringify({ sources })}\n`))

      try {
        const answering = client.messages.stream({
          model: 'claude-opus-5',
          max_tokens: ANSWER_MAX_TOKENS,
          output_config: { effort: 'low' },
          system: SYSTEM,
          messages: [
            {
              role: 'user',
              content: `Passages from the archive:\n\n${contextBlock(passages)}\n\nThe question: ${question}`,
            },
          ],
        })

        for await (const event of answering) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }

        const finished = await answering.finalMessage()
        /* A refusal is a legitimate outcome, not a crash: say something
           true rather than leaving the panel with half a sentence. */
        if (finished.stop_reason === 'refusal') {
          controller.enqueue(
            encoder.encode(
              '\n\nThat question is not one this archive can answer. The desk answers questions in person — the panel has the link.'
            )
          )
        }
      } catch (error) {
        const message =
          error instanceof Anthropic.RateLimitError
            ? '\n\n[The answering service is busy. Please try again in a moment.]'
            : '\n\n[The answer could not be finished. The teachings above are the sources it was drawing on.]'
        controller.enqueue(encoder.encode(message))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  })
}
