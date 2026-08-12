import { readFile } from 'node:fs/promises'
import path from 'node:path'
import * as React from 'react'
import { siteInfo } from '@/lib/content'

/**
 * The shared social-preview card.
 *
 * Every page that can be shared renders through this so a link to the
 * homepage, a topic, or an article all arrive looking like the same
 * publication. WhatsApp is the ministry's main distribution channel and it
 * renders og:image large — a bare link with no card is the difference
 * between a share that gets opened and one that gets scrolled past.
 */

export const OG_SIZE = { width: 1200, height: 630 }

/* The card is the site's own palette: navy ground, gold rule, paper type. */
const GOLD = '#B8944A'
const NAVY = '#0D2C46'
const NAVY_PANEL = '#123B5D'
const PAPER = '#F7F4EC'

/** The two faces the card is set in, read off disk for ImageResponse. */
export async function ogFonts() {
  const [fraunces, montserrat] = await Promise.all([
    readFile(path.join(process.cwd(), 'src/assets/fraunces-600.ttf')),
    readFile(path.join(process.cwd(), 'src/assets/montserrat-700.ttf')),
  ])
  return [
    { name: 'Fraunces', data: fraunces, weight: 600 as const, style: 'normal' as const },
    { name: 'Montserrat', data: montserrat, weight: 700 as const, style: 'normal' as const },
  ]
}

export function OgCard({ kicker, title }: { kicker: string; title: string }) {
  const titleSize = title.length > 80 ? 52 : title.length > 48 ? 60 : 72

  return (
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
              color: PAPER,
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
            <div style={{ fontFamily: 'Fraunces', fontSize: 30, color: PAPER }}>
              {siteInfo.ministry}
            </div>
            <div
              style={{
                fontFamily: 'Montserrat',
                fontSize: 20,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: '#9FB4C8',
              }}
            >
              repentandpreparetheway.org
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
