import { ImageResponse } from 'next/og'
import { siteInfo } from '@/lib/content'
import { OG_SIZE, OgCard, ogFonts } from '@/components/og-card'

/**
 * The site-wide card. Next applies it to every page that does not generate
 * one of its own — the archive, the topic pages, About, the sections — so
 * no shared link from this domain arrives without a preview.
 */

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = `${siteInfo.name} — ${siteInfo.ministry}`

export default async function SiteOpenGraphImage() {
  return new ImageResponse(
    <OgCard kicker="The Publication Desk" title={siteInfo.name} />,
    { ...size, fonts: await ogFonts() }
  )
}
