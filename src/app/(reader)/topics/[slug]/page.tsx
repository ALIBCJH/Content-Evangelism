import * as React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  CATEGORIES,
  categoryBlurb,
  categoryFromSlug,
  categorySlug,
  topicHref,
} from '@/lib/content'
import { listRealRows } from '@/lib/rows'
import { rssAlternate } from '@/lib/seo'
import { ArchiveView } from '@/components/archive/archive-view'

/**
 * A landing page per section.
 *
 * Five of the seven categories — Oracles, Devotional, Doctrine, Church
 * History, Testimony — had no page anywhere on the site, so nothing could
 * rank for them and nothing linked the pieces filed under them together.
 * A topic page exists only once something is actually filed under it, so
 * the site never publishes an empty section.
 */

export const revalidate = 300

interface Params {
  params: { slug: string }
}

export async function generateStaticParams() {
  const rows = await listRealRows()
  const used = new Set(rows.map((row) => row.category))
  return CATEGORIES.filter((category) => used.has(category)).map((category) => ({
    slug: categorySlug(category),
  }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const category = categoryFromSlug(params.slug)
  if (!category) return { title: 'Topic not found', robots: { index: false, follow: false } }

  return {
    title: category,
    description: categoryBlurb[category],
    alternates: { canonical: topicHref(category), types: rssAlternate },
    openGraph: {
      type: 'website',
      title: `${category} — Repent and Prepare the Way`,
      description: categoryBlurb[category],
      url: topicHref(category),
    },
  }
}

export default async function TopicPage({ params }: Params) {
  const category = categoryFromSlug(params.slug)
  if (!category) notFound()

  /* An empty section is a thin page, so it is a 404 rather than a
     placeholder — nothing to index, nothing in the sitemap. */
  const rows = await listRealRows()
  if (!rows.some((row) => row.category === category)) notFound()

  return (
    <ArchiveView
      title={category}
      purpose={categoryBlurb[category]}
      emptyMessage="Nothing is filed here yet."
      filter={(row) => row.category === category}
      crumbs={[{ name: 'Articles', href: '/' }, { name: category }]}
      collection={{
        name: category,
        description: categoryBlurb[category],
        path: topicHref(category),
      }}
    />
  )
}
