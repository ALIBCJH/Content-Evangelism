import { ImageResponse } from 'next/og'
import { siteInfo } from '@/lib/content'
import { getPostedArticle } from '@/lib/posted'
import { OG_SIZE, OgCard, ogFonts } from '@/components/og-card'

/**
 * Branded social-preview card, generated per article. WhatsApp, Facebook,
 * X, LinkedIn, Slack, and Discord all read og:image — a card that carries
 * the title travels better than a bare photograph with no context.
 */

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Article preview card'

export default async function OpenGraphImage({ params }: { params: { slug: string } }) {
  const [article, fonts] = await Promise.all([getPostedArticle(params.slug), ogFonts()])

  return new ImageResponse(
    <OgCard
      kicker={article?.category ?? 'The Publication Desk'}
      title={article?.title ?? siteInfo.name}
    />,
    { ...size, fonts }
  )
}
