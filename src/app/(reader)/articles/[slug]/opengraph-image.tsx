import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { siteInfo } from '@/lib/content'
import { getPostedArticle } from '@/lib/posted'

/**
 * Branded social-preview card, generated per article. WhatsApp, Facebook,
 * X, LinkedIn, Slack, and Discord all read og:image — a card that carries
 * the title travels better than a bare photograph with no context.
 */

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Article preview card'

const GOLD = '#D4A72C'
const NAVY = '#081226'
const NAVY_PANEL = '#0D1B36'

export default async function OpenGraphImage({ params }: { params: { slug: string } }) {
  const [article, fraunces, montserrat] = await Promise.all([
    getPostedArticle(params.slug),
    readFile(path.join(process.cwd(), 'src/assets/fraunces-600.ttf')),
    readFile(path.join(process.cwd(), 'src/assets/montserrat-700.ttf')),
  ])

  const title = article?.title ?? siteInfo.name
  const kicker = article?.category ?? 'The Publication Desk'
  const titleSize = title.length > 80 ? 52 : title.length > 48 ? 60 : 72

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: NAVY,
          backgroundImage: `radial-gradient(ellipse 80% 60% at 20% 0%, ${NAVY_PANEL}, ${NAVY})`,
          padding: 56,
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: `2px solid ${GOLD}66`,
            borderRadius: 24,
            padding: '56px 64px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontFamily: 'Montserrat',
                fontSize: 26,
                letterSpacing: 5,
                textTransform: 'uppercase',
                color: GOLD,
              }}
            >
              {kicker}
            </div>
            <div
              style={{
                marginTop: 28,
                fontFamily: 'Fraunces',
                fontSize: titleSize,
                lineHeight: 1.12,
                color: '#F3EFE6',
                maxWidth: 1000,
              }}
            >
              {title}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', width: 96, height: 4, backgroundColor: GOLD }} />
            <div
              style={{
                marginTop: 24,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontFamily: 'Fraunces', fontSize: 30, color: '#E8E2D4' }}>
                {siteInfo.name}
              </div>
              <div
                style={{
                  fontFamily: 'Montserrat',
                  fontSize: 20,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  color: '#8FA0BF',
                }}
              >
                repentandpreparetheway.org
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Fraunces', data: fraunces, weight: 600, style: 'normal' },
        { name: 'Montserrat', data: montserrat, weight: 700, style: 'normal' },
      ],
    }
  )
}
