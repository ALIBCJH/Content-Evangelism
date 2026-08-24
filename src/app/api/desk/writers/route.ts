import { NextResponse } from 'next/server'
import { canReview, deskToken } from '@/lib/posted'
import { addWriter, listWriters, validateWriter, withoutSecrets } from '@/lib/writers'
import { revalidateAuthors } from '@/lib/revalidate'

/**
 * The people who write here.
 *
 * Review key only, in both directions. The list carries who may approve
 * and who has been turned off, which is the shape of the ministry's own
 * trust, and adding somebody is handing out a key.
 */
export const dynamic = 'force-dynamic'

/** GET — everybody, secrets stripped. */
export async function GET(request: Request) {
  if (!canReview(await deskToken(request))) {
    return NextResponse.json({ error: 'Invalid review key.' }, { status: 401 })
  }
  const writers = (await listWriters()).map(withoutSecrets)
  return NextResponse.json({ writers })
}

/**
 * POST — add a writer, and hand back their key.
 *
 * The one time the key exists in readable form. It is not stored — only a
 * salt and a scrypt hash are — so it cannot be shown again, and the desk
 * says so where it shows it. Somebody who loses theirs is given a new
 * one, which is a smaller thing than a key the store could hand back to
 * anybody who ever reads it.
 */
export async function POST(request: Request) {
  if (!canReview(await deskToken(request))) {
    return NextResponse.json({ error: 'Invalid review key.' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { error, input } = validateWriter(payload)
  if (error || !input) return NextResponse.json({ error }, { status: 400 })

  const added = await addWriter(input)
  if (!added) {
    return NextResponse.json({ error: 'The writer registry is not writable.' }, { status: 500 })
  }

  /* Their author page exists from this moment, and the sitemap should say
     so rather than waiting out the revalidation window. */
  revalidateAuthors()
  return NextResponse.json({ ok: true, ...added }, { status: 201 })
}
