import { NextResponse } from 'next/server'
import { readUpload } from '@/lib/uploads'

/**
 * Serves a picture a writer uploaded at the desk.
 *
 * Deliberately not under `/api`. Three things treat `/api/*` as
 * machinery rather than as content and would be wrong about this one:
 * the service worker refuses to cache it, so a teaching's own photograph
 * would be the one thing missing from a page saved for a journey with no
 * signal; the CSP and the image optimiser both reason about paths; and a
 * URL that ends `.webp` is one anybody debugging can recognise at a
 * glance. This is a file the site serves, so it is served from a path
 * that reads like one.
 *
 * Immutable, and it means it: the filename is a hash of the bytes, so
 * these contents can never change. A different picture is a different
 * URL, which is what makes a year-long cache safe rather than reckless.
 */

/* The bytes come from the store, not the bundle, so this cannot be
   statically rendered — but the answer for any given id never changes,
   which is what the cache header below is for. */
export const dynamic = 'force-dynamic'

const YEAR = 60 * 60 * 24 * 365

export async function GET(_request: Request, { params }: { params: { file: string } }) {
  const bytes = await readUpload(params.file)
  if (!bytes) return NextResponse.json({ error: 'No such picture.' }, { status: 404 })

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'image/webp',
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': `public, max-age=${YEAR}, immutable`,
      /* It is a picture and nothing else; do not let a browser be
         talked into treating it as anything a script could run. */
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': `inline; filename="${params.file}"`,
    },
  })
}
