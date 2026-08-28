import { buildSearchIndex } from '@/lib/search-index'

export const dynamic = 'force-dynamic'

/**
 * GET /api/search-index — the whole archive, flattened for the overlay.
 *
 * This used to be a prop. The reader layout built the index on the server
 * and handed it to the masthead, which is a client component — so every
 * document's `text`, the full plain body of every teaching, was serialised
 * into the RSC payload of every single reader page. On the front page that
 * was 130KB of a 283KB document: forty-six per cent of the page spent on
 * an index for a control most readers never open, carried again on every
 * navigation, and growing with the archive.
 *
 * So it is fetched instead, once, the first time somebody opens search —
 * and the overlay holds it for the rest of the session. A reader who never
 * searches never pays for it, and one who does pays once rather than on
 * every page.
 *
 * Not in the API's `/v1` namespace and not in its OpenAPI document: that
 * is the published, supported surface, and this is the site talking to its
 * own masthead. The shape is `SearchDoc[]`, which is free to change the
 * day the overlay wants something different from it.
 */
export async function GET() {
  const docs = await buildSearchIndex()
  return Response.json(docs, {
    headers: {
      /* Public, because it is the same index for everybody, and there is
         nothing in it that is not already on a published page. A short
         browser life with a long stale window: an edit reaches search
         within the hour, and a reader on a bad connection is never made
         to wait for a revalidation to finish before they can type. */
      'cache-control': 'public, max-age=300, stale-while-revalidate=86400',
    },
  })
}
