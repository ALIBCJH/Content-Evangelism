import type { MetadataRoute } from 'next'
import { authorByName, authorHref, siteUrl, topicHref } from '@/lib/content'
import { prophecyRecords, recordHref } from '@/lib/prophecies'
import { listRealRows } from '@/lib/rows'
import { absoluteUrl } from '@/lib/seo'

/**
 * Every page worth crawling, and nothing else.
 *
 * Deliberately absent:
 *   /search — a utility, noindex; its result pages are thin duplicates.
 *   /admin — noindex and disallowed.
 *
 * Topic and author pages appear only once something is filed under them,
 * so the sitemap never advertises a URL that 404s.
 */

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await listRealRows()
  const newest = rows[0]?.publishedAt

  const articles: MetadataRoute.Sitemap = rows.map((row) => ({
    url: `${siteUrl}${row.href}`,
    lastModified: row.publishedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
    ...(row.imageUrl ? { images: [absoluteUrl(row.imageUrl)] } : {}),
  }))

  /* One entry per category that actually has pieces filed under it,
     stamped with the newest piece in that category. */
  const topics = new Map<string, string>()
  for (const row of rows) {
    const href = topicHref(row.category)
    if (!topics.has(href)) topics.set(href, row.publishedAt)
  }

  /* Likewise for bylines that resolve to an author profile. */
  const authorPages = new Map<string, string>()
  for (const row of rows) {
    const author = authorByName(row.authorName)
    if (!author) continue
    const href = authorHref(author)
    if (!authorPages.has(href)) authorPages.set(href, row.publishedAt)
  }

  const derived = (entries: Map<string, string>, priority: number): MetadataRoute.Sitemap =>
    Array.from(entries, ([href, lastModified]) => ({
      url: `${siteUrl}${href}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority,
    }))

  /* The prophecy archive and its records. Publication dates that are still
     to be confirmed against the source are left unstamped rather than
     guessed at. */
  const records: MetadataRoute.Sitemap = prophecyRecords.map((record) => ({
    url: `${siteUrl}${recordHref(record)}`,
    ...(record.published !== 'To confirm' ? { lastModified: record.published } : {}),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const sections: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/prophecies`, priority: 0.8, changeFrequency: 'weekly' as const },
    { url: `${siteUrl}/teachings`, priority: 0.7, changeFrequency: 'weekly' as const },
    { url: `${siteUrl}/about`, priority: 0.6, changeFrequency: 'monthly' as const },
  ]

  return [
    {
      url: siteUrl,
      lastModified: newest,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    ...sections,
    ...articles,
    ...records,
    ...derived(topics, 0.7),
    ...derived(authorPages, 0.5),
  ]
}
