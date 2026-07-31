import * as React from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Hero, type FrontLead, type FrontRailRow } from '@/components/sections/hero'
import { SectionIndex } from '@/components/sections/section-index'
import { LatestStrip } from '@/components/sections/latest-strip'
import { TodaysVerse } from '@/components/sections/todays-verse'
import { ConnectStrip } from '@/components/sections/connect-strip'
import { mostRead } from '@/lib/content'
import { listRealRows } from '@/lib/rows'

/* The front page is served fresh on every request: the newest published
   article leads, the strip carries the next pieces, and the rail follows —
   an article never appears twice on the page. */
export const dynamic = 'force-dynamic'

export const metadata = {
  alternates: { canonical: '/' },
}

const STRIP_SIZE = 3
const RAIL_SIZE = 5

export default async function HomePage() {
  const rows = await listRealRows()

  const lead: FrontLead = rows[0]
  const strip = rows.slice(1, 1 + STRIP_SIZE)
  const railReal = rows.slice(1 + STRIP_SIZE, 1 + STRIP_SIZE + RAIL_SIZE)

  // Seed pieces keep the rail full while the archive is young.
  const fill: FrontRailRow[] = mostRead.map((a) => ({
    href: '/articles',
    title: a.title,
    category: a.category,
    readMinutes: a.readMinutes,
  }))

  const rail = [
    ...railReal.map(({ href, title, category, readMinutes }) => ({ href, title, category, readMinutes })),
    ...fill,
  ].slice(0, RAIL_SIZE)

  return (
    <>
      <SiteHeader />
      <main>
        <Hero lead={lead} rail={rail} />
        <SectionIndex />
        <LatestStrip rows={strip} />
        <TodaysVerse />
        <ConnectStrip />
      </main>
      <SiteFooter />
    </>
  )
}
