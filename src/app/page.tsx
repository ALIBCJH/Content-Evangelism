import * as React from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Hero, type FrontLead, type FrontRailRow } from '@/components/sections/hero'
import { categoryArt, crossArticle, mostRead } from '@/lib/content'
import { listPostedArticles } from '@/lib/posted'

/* The front page is served fresh on every request: the newest published
   article leads, and the rail carries the pieces after it — no repeats. */
export const dynamic = 'force-dynamic'

const RAIL_SIZE = 5

async function getFrontPage(): Promise<{ lead: FrontLead; rail: FrontRailRow[] }> {
  const posted = await listPostedArticles()

  const rows: FrontLead[] = [
    ...posted.map((a) => ({
      href: `/articles/${a.slug}`,
      title: a.title,
      dek: a.dek,
      category: a.category,
      authorName: a.authorName,
      publishedAt: a.publishedAt,
      readMinutes: a.readMinutes,
      imageUrl: a.imageUrl,
      art: categoryArt[a.category],
    })),
    {
      href: crossArticle.href!,
      title: crossArticle.title,
      dek: crossArticle.dek,
      category: crossArticle.category,
      authorName: 'The Editorial Desk',
      publishedAt: crossArticle.publishedAt,
      readMinutes: crossArticle.readMinutes,
      imageUrl: crossArticle.image?.src,
      art: crossArticle.art,
    },
  ].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  const [lead, ...rest] = rows

  // Fill the rail after the real articles with seed pieces so the column
  // never looks bare while the archive is still young.
  const fill: FrontRailRow[] = mostRead.map((a) => ({
    href: `/articles`,
    title: a.title,
    category: a.category,
    readMinutes: a.readMinutes,
  }))

  const rail = [
    ...rest.map(({ href, title, category, readMinutes }) => ({ href, title, category, readMinutes })),
    ...fill,
  ].slice(0, RAIL_SIZE)

  return { lead, rail }
}

export default async function HomePage() {
  const { lead, rail } = await getFrontPage()
  return (
    <>
      {/* JSON-LD structured data is injected by public/theme-init.js —
          keeping it out of the React tree avoids SSR text-escaping and
          hydration mismatches. */}
      <SiteHeader />
      <main>
        <Hero lead={lead} rail={rail} />
      </main>
      <SiteFooter />
    </>
  )
}
