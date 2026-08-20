import { NextResponse } from 'next/server'
import { siteUrl } from '@/lib/content'
import { statusFor, type ApiError } from '@/lib/api/errors'

/**
 * How every v1 response leaves the building.
 *
 * Two things ride on all of them:
 *
 *   - A cache window. The archive changes when the desk publishes, which
 *     is a few times a month, so a shared cache may hold a response for
 *     five minutes and serve a stale one for an hour while it refreshes.
 *     An agent crawling the collection does not hit the store once per
 *     page.
 *   - A `Link: rel="service-desc"` header (RFC 8631) pointing at the
 *     OpenAPI document. An agent that lands on any endpoint — including
 *     one it guessed — is one header away from the whole specification,
 *     without having been told where to look.
 */

const CACHE = 'public, s-maxage=300, stale-while-revalidate=3600'

export const OPENAPI_PATH = '/api/openapi.json'
export const DOCS_PATH = '/api/v1'

function headers(extra: HeadersInit = {}): HeadersInit {
  return {
    'Cache-Control': CACHE,
    Link: `<${siteUrl}${OPENAPI_PATH}>; rel="service-desc"; type="application/json", <${siteUrl}${DOCS_PATH}>; rel="service-doc"`,
    ...extra,
  }
}

/** A successful answer. */
export function ok<T>(body: T, extra: HeadersInit = {}): NextResponse {
  return NextResponse.json(body, { headers: headers(extra) })
}

/**
 * A refusal. Not cached by a shared cache: a 404 today is a published
 * article tomorrow, and an agent should not be told otherwise for an hour.
 */
export function fail(error: ApiError): NextResponse {
  return NextResponse.json(
    { error },
    { status: statusFor(error.code), headers: headers({ 'Cache-Control': 'no-store' }) }
  )
}
