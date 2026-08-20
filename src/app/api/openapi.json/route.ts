import { NextResponse } from 'next/server'
import { openApiDocument } from '@/lib/api/openapi'

export const dynamic = 'force-dynamic'

/**
 * GET /api/openapi.json — the contract.
 *
 * Served from the same constants the routes validate against, so the
 * document cannot drift from the behaviour it describes.
 */
export async function GET() {
  return NextResponse.json(openApiDocument(), {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}
