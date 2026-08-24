import { ImageResponse } from 'next/og'
import { siteInfo } from '@/lib/content'
import { altarBySlug } from '@/lib/altars'
import { OG_SIZE, OgCard, ogFonts } from '@/components/og-card'

/**
 * The card an altar travels as.
 *
 * WhatsApp is how a congregation actually passes an address around, and
 * it renders og:image large — a link to the Nakuru altar shared into a
 * group should arrive saying Nakuru, not saying the name of the website.
 */

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Altar preview card'

export default async function OpenGraphImage({ params }: { params: { slug: string } }) {
  const [entry, fonts] = await Promise.all([altarBySlug(params.slug), ogFonts()])

  return new ImageResponse(
    <OgCard
      kicker={entry ? `${entry.county.name} County · Where we meet` : 'Where we meet'}
      title={entry?.altar.name ?? siteInfo.name}
    />,
    { ...size, fonts }
  )
}
