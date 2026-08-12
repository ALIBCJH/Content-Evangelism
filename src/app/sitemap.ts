import type { MetadataRoute } from 'next'
import { authorByName, authorHref, siteUrl, topicHref } from '@/lib/content'
import { listRealRows } from '@/lib/rows'
import { absoluteUrl } from '@/lib/seo'

/**
 * Every page worth crawling, and nothing else.
 *
 * Deliberately absent:
 *   /teachings, /prophecies, /about — still Coming Soon placards. Asking
 *     Google to crawl three near-empty pages daily is a site-quality drag,
 *     and they carry noindex to match. Add them back the day they open.
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

  return [
    {
      url: siteUrl,
      lastModified: newest,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    ...articles,
    ...derived(topics, 0.7),
    ...derived(authorPages, 0.5),
  ]
}
