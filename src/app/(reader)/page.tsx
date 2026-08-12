import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { siteUrl } from '@/lib/content'
import { listRealRows } from '@/lib/rows'
import { rssAlternate } from '@/lib/seo'
import { FeaturedArticle } from '@/components/featured-article'
import { HomeHero } from '@/components/home/hero'
import { StatementCards } from '@/components/home/statement-cards'
import { JsonLd } from '@/components/json-ld'

/* The front page: what the ministry proclaims, the piece it is leading
   with, and the two statements it works from. Everything published lives
   one click away at /articles. */

export const metadata: Metadata = {
  title: {
    absolute: 'Prepare the Way — Ministry of Repentance and Holiness',
  },
  description:
    'Biblical teachings, Scripture studies, prophetic messages, sermons, and resources from the Ministry of Repentance and Holiness.',
  alternates: { canonical: '/', types: rssAlternate },
}

/* Statically served and rebuilt every five minutes; the posting desk also
   revalidates this path on publish, so a new lead piece appears at once. */
export const revalidate = 300

export default async function HomePage() {
  const rows = await listRealRows()
  const [lead] = rows

  return (
    <main>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${siteUrl}/#webpage`,
          url: siteUrl,
          name: 'Prepare the Way — Ministry of Repentance and Holiness',
          isPartOf: { '@id': `${siteUrl}/#website` },
          about: { '@id': `${siteUrl}/#ministry` },
          inLanguage: 'en',
        }}
      />

      <HomeHero />
      <div className="gold-rule" />

      {lead && (
        <section className="shell pt-16 lg:pt-20">
          <h2 className="rule-heading mb-7 font-display text-[0.9375rem] font-medium uppercase tracking-[0.12em] text-navy">
            Featured Article
          </h2>
          <FeaturedArticle row={lead} kind="Article" />

          {rows.length > 1 && (
            <p className="mt-7 text-center">
              <Link
                href="/articles"
                className="font-mono text-[0.6875rem] tracking-[0.08em] text-navy transition-colors hover:text-gold"
              >
                ALL {rows.length} ARTICLES →
              </Link>
            </p>
          )}
        </section>
      )}

      <StatementCards />
    </main>
  )
}
